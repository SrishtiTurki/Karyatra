from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()

SERP_API_KEY = os.getenv("SERP_API_KEY")
if not SERP_API_KEY:
    print("[ERROR] SERP_API_KEY not set in .env file")
    exit(1)

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
    "supports_credentials": True
}})

def init_db():
    try:
        conn = sqlite3.connect("bookmarks.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                site TEXT,
                resources TEXT
            )
        """)
        conn.commit()
        print("[INFO] Database initialized successfully")
        return conn
    except sqlite3.Error as e:
        print(f"[ERROR] Database connection failed: {e}")
        raise

def get_all_bookmark_titles():
    try:
        conn = init_db()
        cursor = conn.cursor()
        cursor.execute("SELECT title FROM bookmarks")
        rows = cursor.fetchall()
        conn.close()
        titles = [row["title"] for row in rows]
        print(f"[INFO] Fetched {len(titles)} bookmark titles")
        return titles
    except sqlite3.Error as e:
        print(f"[ERROR] Failed to fetch bookmark titles: {e}")
        return []

def clean_title(raw_title):
    title = raw_title.lower()
    title = re.sub(r'\|.*', '', title)
    title = re.sub(r'-\s*(bangalore|gurgaon|remote|india).*', '', title)
    title = re.sub(r'(at|by)\s+[\w\s,.]+', '', title)
    title = re.sub(r'\b(internship|full[- ]?time|work from home)\b', '', title)
    title = re.sub(r'\b(unstop|indeed|naukri|linkedin|sarjapura)\b', '', title)
    title = re.sub(r'[^a-z\s]', '', title)
    title = re.sub(r'\s+', ' ', title).strip()
    return title.title()

def fetch_links_for_job(job_title):
    try:
        query = f"{job_title} site:leetcode.com OR site:theforage.com"
        print(f"[INFO] Querying LeetCode/Forage: {query}")
        response = requests.get("https://serpapi.com/search", params={
            "q": query,
            "api_key": SERP_API_KEY,
            "num": 5
        })
        response.raise_for_status()
        results = response.json()
        links = results.get("organic_results", [])
        print(f"[INFO] Found {len(links)} results for {job_title}")
        leetcode_links = []
        forage_links = []
        for item in links:
            link = item.get("link")
            title = item.get("title")
            print(f"[INFO] Result: {title}: {link}")
            if link and "leetcode.com" in link:
                leetcode_links.append({"title": title, "link": link})
            elif link and "theforage.com" in link:
                forage_links.append({"title": title, "link": link})
        return {
            "leetcode": leetcode_links,
            "forage": forage_links
        }
    except Exception as e:
        print(f"[ERROR] While fetching LeetCode/Forage for {job_title}: {e}")
        return {"leetcode": [], "forage": []}

def fetch_learning_resources(job_title):
    try:
        query = f"{job_title} marketing resources OR courses OR certifications"
        print(f"[INFO] Querying learning resources: {query}")
        response = requests.get("https://serpapi.com/search", params={
            "engine": "google",
            "q": query,
            "api_key": SERP_API_KEY,
            "num": 10
        })
        response.raise_for_status()
        results = response.json()
        organic_results = results.get("organic_results", [])
        resources = [
            {
                "title": res.get("title"),
                "link": res.get("link"),
                "snippet": res.get("snippet", f"Learn {job_title} from online resources")
            }
            for res in organic_results[:5] if res.get("link")
        ]
        print(f"[INFO] Found {len(resources)} learning resources for {job_title}")
        return resources
    except Exception as e:
        print(f"[ERROR] While fetching learning resources for {job_title}: {e}")
        return []

def fetch_skill_resources(skill_or_role):
    try:
        if not SERP_API_KEY:
            raise ValueError("SERP_API_KEY is not configured")
        # Try a broader query first
        query = f"learn {skill_or_role} site:udemy.com OR site:coursera.org OR site:edx.org"
        print(f"[INFO] Querying skill resources: {query}")
        response = requests.get("https://serpapi.com/search", params={
            "engine": "google",
            "q": query,
            "api_key": SERP_API_KEY,
            "num": 5
        })
        response.raise_for_status()
        results = response.json()
        organic_results = results.get("organic_results", [])
        
        if not organic_results:
            print(f"[WARNING] No organic results for {skill_or_role}, trying fallback query")
            # Fallback to a less restrictive query
            query = f"{skill_or_role} online course"
            print(f"[INFO] Querying fallback: {query}")
            response = requests.get("https://serpapi.com/search", params={
                "engine": "google",
                "q": query,
                "api_key": SERP_API_KEY,
                "num": 5
            })
            response.raise_for_status()
            results = response.json()
            organic_results = results.get("organic_results", [])
        
        if not organic_results:
            print(f"[WARNING] No organic results for fallback query: {skill_or_role}")
        
        resources = [
            {
                "platform": res.get("source") or res.get("displayed_link") or "Resource",
                "title": res.get("title") or f"Learn {skill_or_role}",
                "description": res.get("snippet") or f"Learn {skill_or_role} from online resources",
                "url": res.get("link")
            }
            for res in organic_results if res.get("link") and (
                "udemy.com" in res.get("link") or 
                "coursera.org" in res.get("link") or 
                "edx.org" in res.get("link") or 
                True  # Allow other platforms in fallback
            )
        ]
        print(f"[INFO] Found {len(resources)} skill resources for {skill_or_role}")
        return resources
    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP error fetching skill resources for {skill_or_role}: {e.response.status_code} - {e.response.text}")
        return []
    except Exception as e:
        print(f"[ERROR] While fetching skill resources for {skill_or_role}: {e}")
        return []

def ensure_resources_column():
    try:
        conn = init_db()
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE bookmarks ADD COLUMN resources TEXT")
        conn.commit()
        print("[INFO] Ensured resources column exists")
    except sqlite3.OperationalError:
        print("[INFO] Resources column already exists")
    except Exception as e:
        print(f"[ERROR] Failed to ensure resources column: {e}")
    finally:
        conn.close()

def save_resources_to_db(title, resources_dict):
    try:
        conn = init_db()
        cursor = conn.cursor()
        resources_json = json.dumps(resources_dict)
        cursor.execute("UPDATE bookmarks SET resources = ? WHERE title = ?", (resources_json, title))
        conn.commit()
        print(f"[INFO] Saved resources for {title}")
    except sqlite3.Error as e:
        print(f"[ERROR] Failed to save resources for {title}: {e}")
    finally:
        conn.close()

@app.route("/resources_from_db", methods=["GET"])
def get_resources_from_db():
    print("[INFO] Fetching resources from DB")
    try:
        conn = init_db()
        cursor = conn.cursor()
        cursor.execute("SELECT title, resources FROM bookmarks WHERE resources IS NOT NULL")
        rows = cursor.fetchall()
        conn.close()
        resource_data = []
        for row in rows:
            try:
                resources = json.loads(row["resources"]) if row["resources"] else {}
                resource_data.append({
                    "title": row["title"],
                    "resources": resources
                })
            except json.JSONDecodeError as e:
                print(f"[ERROR] JSON decode error for {row['title']}: {e}")
                continue
        print(f"[INFO] Returning {len(resource_data)} resources from DB")
        return jsonify(resource_data)
    except Exception as e:
        print(f"[ERROR] In /resources_from_db: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/resources_for_all_bookmarks", methods=["GET"])
def fetch_resources_for_all_bookmarks():
    try:
        titles = get_all_bookmark_titles()
        enriched_data = []
        print(f"[INFO] Fetching resources for {len(titles)} bookmarks")
        for raw_title in titles:
            title = clean_title(raw_title)
            leet_forage = fetch_links_for_job(title)
            general = fetch_learning_resources(title)
            combined_resources = {
                "leetcode": leet_forage["leetcode"],
                "forage": leet_forage["forage"],
                "General": general
            }
            save_resources_to_db(raw_title, combined_resources)
            enriched_data.append({
                "job_title": title,
                "resources": combined_resources
            })
        print(f"[INFO] Returning {len(enriched_data)} enriched bookmark resources")
        return jsonify(enriched_data)
    except Exception as e:
        print(f"[ERROR] In /resources_for_all_bookmarks: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/fetch_resources", methods=["GET"])
def fetch_resources():
    skill_or_role = request.args.get("q")
    if not skill_or_role:
        print("[ERROR] Query parameter 'q' is missing")
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    try:
        resources = fetch_skill_resources(skill_or_role)
        print(f"[INFO] Returning {len(resources)} resources for {skill_or_role}")
        return jsonify(resources)
    except Exception as e:
        print(f"[ERROR] In /fetch_resources for {skill_or_role}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    ensure_resources_column()
    app.run(debug=True, port=5003, host="0.0.0.0")