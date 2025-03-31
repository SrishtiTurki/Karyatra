# Skill Gap Analysis System

This project identifies skill gaps by analyzing job descriptions and comparing them with user skills. It extracts required skills from job listings, processes the data, and generates a skill gap report.

## Features

- **Web Scraping**: Extracts job descriptions dynamically.
- **Skill Extraction**: Identifies required skills from job listings.
- **Gap Analysis**: Compares job requirements with user skills.
- **Report Generation**: Outputs missing skills for targeted improvement.

## Installation

1. Clone the repository:
   ```sh
   git clone -b Skill-Gap https://github.com/SrishtiTurki/Karyatra.git
   ```

## Running the Analysis

Run the scripts in the following order:

1. **Start the Flask backend**
   ```sh
   python app.py
   ```
2. **Run the main processing script**
   ```sh
   python main_script.py
   ```
3. **Perform skill gap analysis**
   ```sh
   python skill_gap.py
   ```

## File Structure

```
📂 skill-gap-analysis
 ├── app.py  # Flask server
 ├── main_script.py  # Job description processing
 ├── skill_gap.py  # Skill gap analysis
 ├── README.md
```

## API Endpoints

- **`POST /extract_skills`**: Extracts skills from job descriptions.
  - Request: `{ "job_description": "We need Python and SQL expertise." }`
  - Response: `{ "skills": ["Python", "SQL"] }`

- **`POST /analyze_gap`**: Compares job skills with user skills.
  - Request: `{ "user_skills": ["Python", "Excel"] }`
  - Response: `{ "missing_skills": ["SQL"] }`

## Future Enhancements

- Integration with a recommendation system for learning resources.
- Enhanced NLP-based skill extraction.
- User authentication and profile management.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`.
3. Commit your changes: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-branch`.
5. Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



