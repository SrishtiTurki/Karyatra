#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from simplegmail import Gmail
import re
import csv
import os
import json
from datetime import datetime
import sqlite3
from email_parser import parse_message, extract_company, extract_role, determine_status

class JobApplicationTracker:
    def __init__(self, db_path="./data/job_applications.db", csv_path="./data/job_applications.csv"):
        self.db_path = db_path
        self.applications = []
        """Initialize the job tracker with paths for database and CSV storage."""
        try:
            # Make sure data directory exists
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            
            # Set up Gmail client - will use credentials from the credentials directory
            self.gmail = Gmail()
            
            self.db_path = db_path
            self.csv_path = csv_path
            
            # Create database if it doesn't exist
            self._initialize_database()
        except Exception as e:
            print(f"Initialization error: {e}")
            print("Check that your credential files are properly formatted")
    
        
    def _initialize_database(self):
        """Set up the SQLite database if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create table if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_id TEXT UNIQUE,
            role TEXT,
            company TEXT,
            status TEXT,
            date_received TIMESTAMP,
            subject TEXT,
            sender TEXT,
            last_updated TIMESTAMP,
            message_id TEXT  
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def extract_applications(self, query="subject:(application OR job OR interview OR opportunity)"):
        """Fetch and extract job applications from emails matching the query."""
        print(f"Fetching messages matching query: {query}")
        try:
            messages = self.gmail.get_messages(query=query)
            print(f"Found {len(messages)} matching messages.\n")
            self.applications = []
            for message in messages:
                # Log the message_id for each email
                print(f"Processing message with ID: {message.id}")
                # Skip if we've already processed this email
                #if self._is_email_processed(message.id):
                    #print(f"Skipping already processed message: {message.subject}")
                    #continue
            
            # Parse the message
                application = parse_message(message)
            
                if application:
                    application['message_id'] = message.id  # Add message_id to the application dictionary
                    application['message_link'] = f"https://mail.google.com/mail/u/0/#inbox/{message.id}"  # Add Gmail link
                
                    self.applications.append(application)
                
                # Save to database
                    self._save_to_database(application, message.id)
                    print(f"✅ Saved application from {application['company']} for {application['role']}")
        
            return self.applications
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []

    
    def _is_email_processed(self, email_id):
        """Check if email has already been processed."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM job_applications WHERE email_id = ?", (email_id,))
        result = cursor.fetchone()
        conn.close()
        return result is not None
    
    def _save_to_database(self, application, message_id):
        """Save application data to SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO job_applications 
        (email_id, role, company, status, date_received, subject, sender, last_updated, message_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            application['email_id'],
            application['role'],
            application['company'],
            application['status'],
            application['date_received'],
            application['subject'],
            application['sender'],
            application['last_updated'],
            message_id
        ))
        
        conn.commit()
        conn.close()
    
    def save_to_csv(self):
        """Export applications to CSV file."""
        if not self.applications and os.path.exists(self.db_path):
            # Load from database if applications list is empty
            print("Loading applications from database for CSV export...")
            self._load_from_database()
        if not self.applications:
            print("No applications to save.")
            return
    
        # Include 'message_link' in the fieldnames
        fieldnames = ['role', 'company', 'status', 'date_received', 'subject', 'sender', 'last_updated', 'message_link','message_id']
        
        try:
            # Make sure directory exists
            os.makedirs(os.path.dirname(self.csv_path), exist_ok=True)
            
            with open(self.csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for app in self.applications:
                    app['message_id'] = app.get('message_id', 'N/A') 
                    # Only include the fields we want, including 'message_link'
                    filtered_app = {k: v for k, v in app.items() if k in fieldnames}
                    writer.writerow(filtered_app)
                    
            print(f"Saved {len(self.applications)} applications to {self.csv_path}")
        except Exception as e:
            print(f"Error saving to CSV: {e}")

    
    def _load_from_database(self):
        """Load applications from the database."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT email_id, role, company, status, date_received, subject, sender, last_updated, message_id
        FROM job_applications
        ''')
        
        rows = cursor.fetchall()
        self.applications = []
        
        for row in rows:
            app = dict(row)
            app['message_link'] = f"https://mail.google.com/mail/u/0/#inbox/{row['message_id']}"  # Add Gmail link
            self.applications.append(app)
            
        conn.close()
        print(f"Loaded {len(self.applications)} applications from database.")
    
    def get_application_stats(self):
        """Get statistics about job applications."""
        if not self.applications and os.path.exists(self.db_path):
            self._load_from_database()
            
        if not self.applications:
            return {
                "status_counts": {},
                "top_companies": {},
                "latest_applications": [],
                "total_applications": 0
            }
        
        # Count statuses
        status_counts = {}
        for app in self.applications:
            status = app.get('status', 'Unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count companies
        company_counts = {}
        for app in self.applications:
            company = app.get('company', 'Unknown')
            company_counts[company] = company_counts.get(company, 0) + 1
        
        # Sort by count and get top 5
        sorted_companies = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)
        top_companies = dict(sorted_companies[:5])
        
        # Get latest applications (by date)
        sorted_apps = sorted(self.applications, key=lambda x: x.get('date_received', ''), reverse=True)
        latest_apps = sorted_apps[:10]
        
        return {
            "status_counts": status_counts,
            "top_companies": top_companies,
            "latest_applications": latest_apps,
            "total_applications": len(self.applications)
        }

    def print_stats(self):
        """Print application statistics in a readable format."""
        stats = self.get_application_stats()
        
        print("\n📊 Application Statistics:")
        print(f"Total Applications: {stats['total_applications']}")
        
        if stats['status_counts']:
            print("\nStatus Breakdown:")
            for status, count in stats['status_counts'].items():
                print(f"  • {status}: {count}")
        
        if stats['top_companies']:
            print("\nTop Companies:")
            for company, count in stats['top_companies'].items():
                print(f"  • {company}: {count} applications")
        
        if stats['latest_applications']:
            print("\nLatest Applications:")
            for app in stats['latest_applications']:
                print(f"  • {app.get('role', 'Unknown')} at {app.get('company', 'Unknown')} - {app.get('status', 'Unknown')}")
