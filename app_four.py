# In your Flask app (port 5003)
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from serpapi import GoogleSearch
import os
from dotenv import load_dotenv
load_dotenv()

SERP_API_KEY = os.getenv("SERP_API_KEY")

app = Flask(__name__)
# Configure CORS to allow credentials
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173"], 
    "supports_credentials": True
}})

def init_db():
    conn = sqlite3.connect("bookmarks.db")
    conn.row_factory = sqlite3.Row
    return conn

def get_all_bookmark_titles():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT title FROM bookmarks")
    rows = cursor.fetchall()
    conn.close()
    return [row["title"] for row in rows]

import re

def clean_title(raw_title):
    # Lowercase for uniformity
    title = raw_title.lower()
    
    # Remove common suffixes like location, job boards, etc.
    title = re.sub(r'\|.*', '', title)            # Remove anything after '|'
    title = re.sub(r'-\s*(bangalore|gurgaon|remote|india).*', '', title)  # Remove location
    title = re.sub(r'(at|by)\s+[\w\s,.]+', '', title)  # Remove 'at CompanyName'
    title = re.sub(r'\b(internship|full[- ]?time|work from home)\b', '', title)
    title = re.sub(r'\b(unstop|indeed|naukri|linkedin|sarjapura)\b', '', title)
    
    # Remove extra punctuation and whitespace
    title = re.sub(r'[^a-z\s]', '', title)
    title = re.sub(r'\s+', ' ', title).strip()

    # Capitalize for final look
    return title.title()


def fetch_links_for_job(job_title):
    try:
        query = f"{job_title} site:leetcode.com OR site:theforage.com"
        print("[QUERY] LeetCode/FORAGE:", query)

        search = GoogleSearch({
            "q": query,
            "api_key": SERP_API_KEY,
            "num": 5
        })

        results = search.get_dict()
        print("[RESULTS RAW]", results)

        links = results.get("organic_results", [])
        print(f"[FOUND {len(links)} RESULTS]")

        leetcode_links = []
        forage_links = []

        for item in links:
            link = item.get("link")
            title = item.get("title")
            print(f"→ {title}: {link}")
            if "leetcode.com" in link:
                leetcode_links.append({"title": title, "link": link})
            elif "theforage.com" in link:
                forage_links.append({"title": title, "link": link})

        return {
            "leetcode": leetcode_links,
            "forage": forage_links
        }

    except Exception as e:
        print(f"[ERROR] While fetching LeetCode/Forage: {e}")
        return {"leetcode": [], "forage": []}


def fetch_learning_resources(job_title):
    search = GoogleSearch({
        "engine": "google",
        "q": f"{job_title} marketing resources OR courses OR certifications",
        "api_key": SERP_API_KEY,
        "num": 10  # Number of results to fetch
    })

    results = search.get_dict()
    organic_results = results.get("organic_results", [])

    return [
        {"title": res.get("title"), "link": res.get("link")}
        for res in organic_results[:5]
    ]
    
def ensure_resources_column():
    conn = init_db()
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE bookmarks ADD COLUMN resources TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists
    conn.close()

import json

def save_resources_to_db(title, resources_dict):
    conn = init_db()
    cursor = conn.cursor()
    
    # Convert dict to JSON string
    resources_json = json.dumps(resources_dict)

    # Store it under the correct title
    cursor.execute("UPDATE bookmarks SET resources = ? WHERE title = ?", (resources_json, title))
    conn.commit()
    conn.close()
    
# Modify your /resources_from_db endpoint to ensure it returns proper data
@app.route("/resources_from_db", methods=["GET"])
def get_resources_from_db():
    print("THIS WORKSSSSSSSSSSSSSSSS")
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT title, resources FROM bookmarks WHERE resources IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()

    if not rows:  # If no resources exist, fetch them
        fetch_resources_for_all_bookmarks()
        return get_resources_from_db()  # Recursively call self after fetching

    resource_data = []
    for row in rows:
        try:
            resources = json.loads(row["resources"]) if row["resources"] else {}
            resource_data.append({
                "title": row["title"],
                "resources": resources
            })
        except json.JSONDecodeError:
            continue

    return jsonify(resource_data)



@app.route("/")
def home():
    return "This is for resource Recommendation!"

@app.route("/resources_for_all_bookmarks", methods=["GET"])
def fetch_resources_for_all_bookmarks():
    titles = get_all_bookmark_titles()
    enriched_data = []
    
    print("THIS ALSOOOOOOOOOOOO")

    for raw_title in titles:
        title = clean_title(raw_title)
        leet_forage = fetch_links_for_job(title)
        General = fetch_learning_resources(title)

        combined_resources = {
            **leet_forage,
            "General": General
        }

        # Save to DB
        save_resources_to_db(raw_title, combined_resources) 

        # Also keep it for the response
        enriched_data.append({
            "job_title": title,
            "resources": combined_resources
        })

    return jsonify(enriched_data)


if __name__ == "__main__":
    ensure_resources_column()  # this must be run at least once to create the 'resources' column
    app.run(debug=True, port=5003)