import sqlite3
import time
import sys
from job_Des import extract_job_descriptions_parallel  # Import your function

def fetch_job_urls():
    """Fetch job URLs from the SQLite database."""
    conn = sqlite3.connect("bookmarks.db")  # Ensure this is the correct database name
    cursor = conn.cursor()

    # Check if the table exists before querying
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'")
    if not cursor.fetchone():
        print("ERROR: Table 'bookmarks' does not exist.")
        conn.close()
        sys.exit(1)

    # Fetch URLs
    cursor.execute("SELECT url FROM bookmarks")  
    job_urls = [row[0] for row in cursor.fetchall()]  

    conn.close()
    return job_urls

def ensure_skills_column():
    """Ensure the 'skills' column exists in the 'bookmarks' table."""
    conn = sqlite3.connect("bookmarks.db")
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE bookmarks ADD COLUMN skills TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists, no need to alter

    conn.close()

def save_extracted_skills(job_url, skills):
    """Store extracted skills in the database."""
    conn = sqlite3.connect("bookmarks.db")
    cursor = conn.cursor()

    # Convert skill set to a comma-separated string
    skills_string = ",".join(skills)

    # Update the database with extracted skills
    cursor.execute("UPDATE bookmarks SET skills = ? WHERE url = ?", (skills_string, job_url))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    ensure_skills_column()  # Make sure the 'skills' column exists

    job_urls = fetch_job_urls()

    if not job_urls:
        print("No job URLs found in the database.")
        sys.exit(1)

    # Fast parallel extraction
    start_time = time.time()
    results = extract_job_descriptions_parallel(job_urls, max_workers=4)
    end_time = time.time()

    # Final summary
    print(f"\nExecution time: {end_time - start_time:.2f} seconds")
    print("\nSummary:")

    for url, result in results.items():
        if result["description"]:
            print(f"\nJob Title: {result['title']}")
            print(f"URL: {url}")
            print(f"Description Keywords: {result['description_keywords']}")
            print(f"Requirements Keywords: {result['requirements_keywords']}")

            # Extracted skills from job description
            extracted_skills = set(result["description_keywords"]) | set(result["requirements_keywords"])
            
            # Save skills to the database
            save_extracted_skills(url, extracted_skills)
        else:
            print(f"\nFailed - {url}")
            print(f"Title (if found): {result['title']}")
