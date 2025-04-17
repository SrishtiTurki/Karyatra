import sqlite3
import pdfplumber
import re
import os

def fetch_extracted_job_skills():
    """Fetch job skills per URL from 'bookmarks.db' (Forces database refresh)."""
    conn = sqlite3.connect("bookmarks.db")
    conn.row_factory = sqlite3.Row  # Ensures row data is fetched fresh
    cursor = conn.cursor()

    cursor.execute("SELECT url, skills FROM bookmarks")
    
    job_skills_per_url = {}
    
    for row in cursor.fetchall():
        url, skills = row
        if skills:  
            skills_list = skills.split(",")  
            job_skills_per_url[url] = set(skill.strip().lower() for skill in skills_list)

    conn.close()
    return job_skills_per_url  

def extract_skills_from_resume(resume_path):
    """Extract all skills present in the resume."""
    with pdfplumber.open(resume_path) as pdf:
        text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    
    return set(re.findall(r"\b\w+\b", text.lower()))  # Extract all words as possible skills

def skill_gap_analysis(resume_path):
    """Compare resume skills against each job URL."""
    job_skills_per_url = fetch_extracted_job_skills()  # Get skills per job link
    print(job_skills_per_url)
    resume_skills = extract_skills_from_resume(resume_path)  # Extract resume skills

    missing_skills_per_url = {}

    for url, job_skills in job_skills_per_url.items():
        missing_skills = job_skills - resume_skills  # Skills required but not in resume
        missing_skills_per_url[url] = missing_skills  # Store even if empty

    return missing_skills_per_url

import sys
import os

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python skill_gap.py <resume_path>")
        exit()

    resume_path = sys.argv[1]
    
    if not os.path.exists(resume_path):
        print("ERROR: File not found!", resume_path)
        exit()

    analysis = skill_gap_analysis(resume_path)

    print("\nSkill Gap Analysis per Job Link:")
    for url, missing_skills in analysis.items():
        print(f"\nJob URL: {url}")
        if missing_skills:
            print("Missing Skills:", ", ".join(missing_skills))
        else:
            print("You're good to go! No missing skills for this job.")

