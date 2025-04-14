#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
from datetime import datetime

def parse_message(message):
    """Extract job application details from an email message."""
    try:
        subject = message.subject
        sender = message.sender
        snippet = message.snippet
        body = message.plain or ""
        email_id = message.id
        
        print(f"Processing: {subject}")
        
        # Extract company name
        company = extract_company(sender, subject, body)
        
        # Extract job role
        role = extract_role(subject, body)
        
        # Determine application status
        status = determine_status(body, subject)
        
        # Create application record
        application = {
            "email_id": email_id,
            "role": role,
            "company": company,
            "status": status,
            "date_received": message.date,
            "subject": subject,
            "sender": sender,
            "last_updated": datetime.now().isoformat()
        }
        
        return application
    except Exception as e:
        print(f"Error parsing message: {e}")
        return None

def extract_company(sender, subject, body):
    """Extract company name from email metadata and content, with platform filtering and debug logs."""

    platforms = ['linkedin', 'unstop', 'naukri', 'instahyre', 'foundit', 'indeed']

    # Try sender domain first
    sender_domain = re.search(r'@([^>]+)', sender)
    if sender_domain:
        domain = sender_domain.group(1).split('.')[0].lower()
        if domain not in platforms and domain not in ['gmail', 'hotmail', 'yahoo', 'outlook', 'mail']:
            print(f"🟢 Company extracted from sender domain: {domain.title()}")
            return domain.title()
        else:
            print(f"⚠️ Ignored platform domain: {domain}")

    # Common patterns in subject
    company_patterns = [
        r'from\s+([A-Z][A-Za-z0-9\s&]+)',
        r'at\s+([A-Z][A-Za-z0-9\s&]+)',
        r'with\s+([A-Z][A-Za-z0-9\s&]+)',
        r'([A-Z][A-Za-z0-9\s&]+)\s+job',
        r'([A-Z][A-Za-z0-9\s&]+)\s+application',
        r'([A-Z][A-Za-z0-9\s&]+)\s+careers'
    ]

    for pattern in company_patterns:
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            company = match.group(1).strip()
            print(f"📝 Company extracted from subject: {company}")
            return company

    for pattern in company_patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            company = match.group(1).strip()
            print(f"📨 Company extracted from email body: {company}")
            return company

    print("❌ Could not determine company name, defaulting to 'Unknown Company'")
    return "Unknown Company"



import re

def extract_role(subject, body):
    """Extract job role from email subject and body using keyword search."""
    # List of potential job roles (you can extend this list as needed)
    job_roles = [
        "Data Scientist", "Data Analyst", "Software Engineer", "Developer", 
        "Summer Analyst", "Designer", "Manager", "Consultant", "AI Researcher", 
        "Intern", "Business Analyst", "Full Stack Developer", "Frontend Developer", 
        "Backend Developer", "Product Manager"
    ]
    
    # Convert the subject and body to lowercase to ensure case-insensitive matching
    subject_lower = subject.lower()
    body_lower = body.lower()

    # Loop through each job role keyword and search in the subject
    for role in job_roles:
        # Create a regex pattern for each job role (case-insensitive search)
        pattern = re.escape(role.lower())  # escape special characters in role
        
        # Check if role is in the subject
        match = re.search(pattern, subject_lower)
        if match:
            return role  # return role in its original case (as listed in job_roles)
        
        # If not found in the subject, check in the body
        match = re.search(pattern, body_lower)
        if match:
            return role  # return role in its original case (as listed in job_roles)

    # Default if no match is found
    return "Unknown Role"


def determine_status(body, subject):
    """Determine application status based on email content."""
    # Define status patterns and their priority (order matters)
    status_patterns = [
        (r'offer\s+letter|job\s+offer|employment\s+offer', 'Offer Received'),
        (r'congratulations|selected|successful', 'Selected'),
        (r'interview\s+invite|schedule\s+(?:an|your)\s+interview', 'Interview Invitation'),
        (r'technical\s+(?:interview|assessment|challenge)', 'Technical Assessment'),
        (r'phone\s+(?:interview|screen|call)', 'Phone Screening'),
        (r'reject|regret|not\s+selected|not\s+moving\s+forward|unsuccessful', 'Rejected'),
        (r'application\s+(?:received|confirmed)', 'Application Received'),
        (r'on\s+hold|pause', 'On Hold')
    ]
    
    # Check body and subject for status patterns
    text_to_check = body + " " + subject
    
    for pattern, status in status_patterns:
        if re.search(pattern, text_to_check, re.IGNORECASE):
            return status
    
    # Default status
    return "Application Submitted"