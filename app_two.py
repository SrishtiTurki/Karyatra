from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import sqlite3
import urllib.parse

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect("bookmarks.db")
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE
        )
    ''')
    conn.commit()
    conn.close()

def get_bookmarks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title, url FROM bookmarks")
    bookmarks = cursor.fetchall()
    conn.close()
    
    categorized_bookmarks = {}

    for title, url in bookmarks:
        domain = urllib.parse.urlparse(url).netloc  # Extract website domain

        if domain not in categorized_bookmarks:
            categorized_bookmarks[domain] = []

        categorized_bookmarks[domain].append({"title": title, "url": url})

    return categorized_bookmarks

@app.route("/")
def home():
    return "Welcome to the Bookmark API!"

@app.route("/bookmarks", methods=["GET"])
def fetch_bookmarks():
    return jsonify(get_bookmarks())

@app.route("/bookmarks", methods=["POST"])
def add_bookmark():
    data = request.get_json()
    title = data.get('title')
    url = data.get('url')

    if not title or not url:
        return jsonify({"error": "Title and URL are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO bookmarks (title, url) VALUES (?, ?)", (title, url))
        conn.commit()
        conn.close()
        return jsonify({"message": "Bookmark added successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Bookmark with this URL already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/bookmarks', methods=['DELETE'])
def delete_bookmark():
    data = request.get_json()
    url_to_delete = data.get('url')
    if not url_to_delete:
        return jsonify({"error": "No URL provided"}), 400

    domain = urllib.parse.urlparse(url_to_delete).netloc.lower() or url_to_delete.lower()
    print(f"Trying to delete domain: {domain}")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Find all bookmarks matching this domain
    cursor.execute("SELECT * FROM bookmarks")
    bookmarks = cursor.fetchall()

    deleted = False
    for bookmark in bookmarks:
        stored_url = bookmark["url"]
        stored_domain = urllib.parse.urlparse(stored_url).netloc.lower().rstrip('/')

        if stored_domain == domain:
            cursor.execute("DELETE FROM bookmarks WHERE url = ?", (stored_url,))
            deleted = True
            print(f"Deleted: {stored_url}")
            break  # Remove this line if you want to delete **all** from that domain

    conn.commit()
    conn.close()

    if not deleted:
        return jsonify({"error": "Bookmark not found"}), 404

    return jsonify({"message": "Bookmark deleted successfully"}), 200




if __name__ == "__main__":
    init_db()  # Initialize the database on startup
    app.run(port=5001, debug=True)