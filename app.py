# In your Flask app (app.py)
import sqlite3
from flask import Flask, jsonify, request

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('bookmarks.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS bookmarks
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 url TEXT UNIQUE,
                 title TEXT,
                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

@app.route('/api/bookmarks', methods=['GET', 'POST', 'DELETE'])
def handle_bookmarks():
    conn = sqlite3.connect('bookmarks.db')
    c = conn.cursor()
    
    if request.method == 'GET':
        c.execute("SELECT * FROM bookmarks ORDER BY created_at DESC")
        bookmarks = [{'id': row[0], 'url': row[1], 'title': row[2]} for row in c.fetchall()]
        return jsonify(bookmarks)
    
    elif request.method == 'POST':
        data = request.json
        try:
            c.execute("INSERT INTO bookmarks (url, title) VALUES (?, ?)",
                     (data['url'], data.get('title', '')))
            conn.commit()
            return jsonify({'message': 'Bookmark saved'}), 201
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Bookmark already exists'}), 409
    
    elif request.method == 'DELETE':
        c.execute("DELETE FROM bookmarks")
        conn.commit()
        return jsonify({'message': 'All bookmarks deleted'})
    
    conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
