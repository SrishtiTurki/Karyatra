#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, jsonify
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)

# Function to get data from database
def get_application_data():
    db_path = "./data/job_applications.db"
    
    if not os.path.exists(db_path):
        return {
            "applications": [],
            "status_counts": {},
            "company_counts": {},
            "total": 0
        }
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all applications
    cursor.execute('''
    SELECT role, company, status, date_received, subject, sender, last_updated, message_id
    FROM job_applications
    ORDER BY date_received DESC
    ''')
    
    applications = []
    for row in cursor.fetchall():
        app_data = dict(row)
        message_id = app_data.get("message_id")
        if message_id:
            # Generate Gmail link using message_id
            app_data["gmail_link"] = f"https://mail.google.com/mail/u/0/#inbox/{message_id}"
        else:
            app_data["gmail_link"] = None
        applications.append(app_data)
    
    # Get status counts
    cursor.execute('''
    SELECT status, COUNT(*) as count
    FROM job_applications
    GROUP BY status
    ''')
    
    status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
    
    # Get company counts
    cursor.execute('''
    SELECT company, COUNT(*) as count
    FROM job_applications
    GROUP BY company
    ORDER BY count DESC
    LIMIT 10
    ''')
    
    company_counts = {row['company']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    return {
        "applications": applications,
        "status_counts": status_counts,
        "company_counts": company_counts,
        "total": len(applications)
    }

@app.route('/')
def index():
    """Render the dashboard homepage."""
    return render_template('index.html')

@app.route('/api/applications')
def api_applications():
    """API endpoint to get all application data."""
    data = get_application_data()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)