# Job Bookmarking Chrome Extension

This Chrome extension allows users to bookmark job-related websites and store them in a Flask-based backend. The stored bookmarks are then saved into an SQLite3 database for easy access and management.

## Features

- **Bookmark Job Listings**: Quickly save job-related web pages directly from Chrome.
- **Flask Backend**: The extension sends bookmarked job pages to a Flask server.
- **SQLite3 Database Storage**: Flask stores the bookmarked jobs in an SQLite3 database for persistent access.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/SrishtiTurki/Karyatra.git
   ```
2. Load the extension into Chrome:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the `extension` folder.

## Backend Setup (Flask + SQLite3)

1. Install dependencies:
   ```sh
   pip install flask flask-cors sqlite3
   ```
2. Run the Flask server:
   ```sh
   python app.py
   ```
3. The backend should now be running on `http://127.0.0.1:5000/`.

## Usage

1. Navigate to any job listing website.
2. Click the extension icon to bookmark the page.
3. The page URL is sent to the Flask backend and stored in SQLite3.
4. Access your saved job bookmarks through the extension UI.

## File Structure

```
📂 job-bookmark-extension
 ├── 📂 extension
 │   ├── manifest.json
 │   ├── popup.html
 │   ├── popup.js
 │   ├── background.js
 │   ├── styles.css
 ├── 📂 backend
 │   ├── app.py  # Flask server
 │   ├── database.db  # SQLite3 database, will create one if not there
 ├── README.md
```

## API Endpoints

- **`POST /add_bookmark`**: Stores a bookmarked job page.
  - Request: `{ "url": "https://example.com/job-listing" }`
  - Response: `{ "message": "Bookmark added successfully" }`

- **`GET /bookmarks`**: Retrieves all saved job bookmarks.
  - Response: `{ "bookmarks": [ {"id": 1, "url": "https://example.com/job-listing"} ] }`

## Future Enhancements

- Implement a user authentication system.
- Add categorization for different job types.
- Provide a search/filter feature for bookmarks.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`.
3. Commit your changes: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-branch`.
5. Submit a pull request.
