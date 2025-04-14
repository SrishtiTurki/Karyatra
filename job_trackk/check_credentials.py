#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
from simplegmail import Gmail

def check_json_file(filepath):
    """Check if a JSON file exists and is properly formatted."""
    print(f"Checking {filepath}...")
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ File is valid JSON: {filepath}")
        return True
    except UnicodeDecodeError:
        print(f"❌ File encoding issue: {filepath}")
        print("   Try opening the file in a text editor and saving with UTF-8 encoding")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON format in {filepath}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return False

def check_gmail_credentials():
    """Check if Gmail API credentials are properly set up."""
    current_dir = os.getcwd()
    
    # Check client_secret.json
    client_secret_path = os.path.join(current_dir, 'client_secret.json')
    client_secret_valid = check_json_file(client_secret_path)
    
    # Check gmail_token.json
    token_path = os.path.join(current_dir, 'tokens','gmail_token.json')
    token_valid = check_json_file(token_path)
    
    if client_secret_valid and token_valid:
        print("\n✅ Credential files appear to be valid.")
        print("You should be able to run the JobApplicationTracker successfully.")
    else:
        print("\n❌ There are issues with your credential files.")
        print("Suggestions:")
        if not client_secret_valid:
            print("1. Download a new client_secret.json from Google Cloud Console")
            print("   - Go to https://console.cloud.google.com")
            print("   - Create or select a project")
            print("   - Enable Gmail API")
            print("   - Create OAuth credentials and download as client_secret.json")
        if not token_valid:
            print("2. Delete gmail_token.json (it will be regenerated)")
        print("3. Make sure both files use UTF-8 encoding")

def setup_credentials():
    """Trigger Gmail API authentication using simplegmail."""
    print("🔐 Setting up Gmail API credentials...")

    try:
        gmail = Gmail()  # Will prompt OAuth if token is missing or expired
        profile = gmail.service.users().getProfile(userId='me').execute()
        print(f"✅ Successfully authenticated as: {profile['emailAddress']}")
    except Exception as e:
        print(f"❌ Failed to authenticate with Gmail API: {e}")
        print("Please make sure your client_secret.json is present and valid.")
        return

    # Validate both files post-authentication
    check_gmail_credentials()

if __name__ == "__main__":
    print("Gmail API Credential Checker")
    print("===========================")
    check_gmail_credentials()
