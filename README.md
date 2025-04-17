Setup Instructions
Step 1: Clone the Repository

First, clone the repository:

git clone https://github.com/SrishtiTurki/Karyatra.git
cd Karyatra
git checkout gmail-parse

Step 2: Set Up Google Cloud Project

To use the Gmail API, you'll need to create a project in Google Cloud:

    Go to the Google Cloud Console.

    Create a new project or select an existing one.

    Enable the Gmail API.

    Create OAuth 2.0 credentials (client ID and secret).

    Download the credentials JSON file.

Rename the downloaded file to client_secret.json and place it in the project root directory.
(make sure the test user is added to test users under my-app)
Step 3: Install Dependencies

Install the necessary Python packages:

pip install simplegmail flask

This will install the SimpleGmail library for Gmail interaction and Flask for the web server.
Step 4: Run the Main Script

Run the main.py script to authenticate with Gmail and start the job tracking process:

python main.py

This will prompt you to authenticate using your Google account, login  pull job-related emails from your Gmail inbox, and store the extracted data in the database and automatically in csv file and the sqlite database.
Step 5: Run the Dashboard

To view the job application details on the dashboard, run the Flask application:

python dashboard.py

This will start the Flask web server, and you can view the job application data on your Karyatra dashboard at http://127.0.0.1:5000/.
Using the Job-Track Feature

Once the Gmail parsing and job status update process is completed, the job application details are stored in the sqlite database. You can access these details through the Karyatra dashboard.
Configuration

    Gmail Parsing Regex: The script uses regular expressions (regex) to parse job application-related emails. If needed, you can modify the regex.py file to update or enhance the email parsing logic.

    Email Filters: Customize the Gmail query in the script to filter job-related emails from specific senders, subject lines, or dates.
