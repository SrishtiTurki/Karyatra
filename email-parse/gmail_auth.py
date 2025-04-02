from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os

# Define the scope for Gmail API
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def gmail_authenticate():
    creds = None
    # Check if token.json already exists
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json")
    # If credentials are not valid, re-authenticate
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            "credentials.json", SCOPES
        )
        creds = flow.run_local_server(port=0)
        # Save the credentials to token.json
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)
