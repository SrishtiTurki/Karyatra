#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import argparse
from job_tracker import JobApplicationTracker
from check_credentials import setup_credentials

def main():
    parser = argparse.ArgumentParser(description='Job Application Email Tracker')
    parser.add_argument('--setup', action='store_true', help='Setup credentials and check configuration')
    parser.add_argument('--query', type=str, default="subject:(application OR job OR interview OR opportunity)",
                      help='Gmail search query to find job application emails')
    parser.add_argument('--dashboard', action='store_true', help='Run the dashboard after processing')
    
    args = parser.parse_args()
    
    # Create necessary directories
    os.makedirs("data", exist_ok=True)
    
    # Check/setup credentials if requested
    if args.setup:
        setup_credentials()
        return
    
    # Create tracker instance
    tracker = JobApplicationTracker(db_path="data/job_applications.db", csv_path="data/job_applications.csv")
    
    # Extract applications with provided query
    print("Extracting job applications from Gmail...")
    applications = tracker.extract_applications(query=args.query)
    
    # Save to CSV
    print("\nSaving to CSV file...")
    tracker.save_to_csv()
    
    # Print stats
    tracker.print_stats()
    
    print("\nDone! Your job applications have been processed.")
    print(f"Data saved to: data/job_applications.db and data/job_applications.csv")
    
    # Launch dashboard if requested
    if args.dashboard:
        print("\nStarting dashboard...")
        from dashboard import app
        app.run(debug=True)

if __name__ == "__main__":
    main()