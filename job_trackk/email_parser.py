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
            "last_updated": datetime.now().isoformat(),
            "gmail_link": f"https://mail.google.com/mail/u/0/#inbox/{email_id}"
        }
        
        return application
    except Exception as e:
        print(f"Error parsing message: {e}")
        return None

def extract_company(sender, subject, body):
    """Extract company name from email metadata and content, with platform filtering and debug logs."""
    # Known companies to look for specifically
    known_companies = [
        "Agron Remedies Private Limited",
        "Sea",
        "Google",
        "Goldman Sachs",
        "SIP Check",
        "Latracal Solutions Pvt Ltd",
        "CBIT Open Source Community",
        "Girl Hackathon",
        "My Peoples Card"
    ]
    
    # First check if any known company is mentioned directly in the body
    for company in known_companies:
        if company.lower() in body.lower():
            print(f"🎯 Found exact company match: {company}")
            return company
    
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
    elif "fwd" in subject.lower():
        print("🔄 Fwd detected in subject. Searching body for company name...")
        body_patterns = [
            r'at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
            r'from\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
            r'join(?:ing)?\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
            r'opportunity\s+at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
            r'career\s+with\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
            # Add pattern for "internship at [Company]"
            r'internship\s+at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        ]
        for pattern in body_patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                company = match.group(1).strip()
                print(f"📨 Company extracted from email body (Fwd): {company}")
                return company
    
    # Always check body for specific patterns regardless of subject
    body_patterns = [
        r'at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        r'from\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        r'join(?:ing)?\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        r'opportunity\s+at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        r'career\s+with\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
        r'internship\s+at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Pvt\s+Ltd\.|Ltd\.|Inc\.)?)',
    ]
    
    for pattern in body_patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            company = match.group(1).strip()
            print(f"📨 Company extracted from email body: {company}")
            return company

    # Common patterns in subject
    company_patterns = [
        r'from\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)',
        r'at\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)',
        r'with\s+([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)',
        r'([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)\s+job',
        r'([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)\s+application',
        r'([A-Za-z0-9\s&]+(?:Private\s+Limited|Ltd\.|Pvt\s+Ltd\.|Inc\.)?)\s+careers'
    ]
    for pattern in company_patterns:
        match = re.search(pattern, subject, re.IGNORECASE)
        if match:
            company = match.group(1).strip()
            print(f"📝 Company extracted from subject: {company}")
            return company
            
    print("❌ Could not determine company name, defaulting to 'Unknown Company'")
    return "Unknown Company"


def extract_role(subject, body):
    """Extract job role from email subject and body using keyword search."""
    # List of potential job roles (you can extend this list as needed)
    job_roles = [
        "Data Scientist", "Data Analyst", "Full Stack Developer", "Software Engineer", "Website Developer", "Developer", 
        "Summer Analyst", "Designer", "Manager", "Consultant", "AI Researcher", 
        "Intern", "Business Analyst", "Frontend Developer", 
        "Backend Developer", 
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