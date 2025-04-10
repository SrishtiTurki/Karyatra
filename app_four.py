from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from serpapi import GoogleSearch
import os
from dotenv import load_dotenv
load_dotenv()

SERP_API_KEY = os.getenv("SERP_API_KEY") # set this in your terminal or .env


app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect("D:/Karyatra/bookmarks.db")
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

@app.route("/")
def home():
    return "This is for resource Recommendation!"

@app.route("/resources_for_all_bookmarks", methods=["GET"])
def fetch_resources_for_all_bookmarks():
    titles = get_all_bookmark_titles()
    enriched_data = []

    for raw_title in titles:
        title = clean_title(raw_title)
        leet_forage = fetch_links_for_job(title)
        General = fetch_learning_resources(title)


        enriched_data.append({
            "job_title": title,
            "resources": {
                **leet_forage,
                "General": General
            }
        })

    return jsonify(enriched_data)

if __name__ == "__main__":
    app.run(debug=True, port=5003)


