
# 🌐 Karyatra

**Karyatra** is a dynamic job tracking and modulation system designed to help users stay on top of their job tracking. With integrated scraping, intelligent analysis, and personalized tracking, Karyatra ensures no opportunity slips through the cracks.

---

## ✨ Features

- 🔍 **Job Description Scraping**  
  Dynamically scrapes job postings from any website via a Chrome extension. No restrictions — works across platforms, not limited to a single portal.

- 🧠 **Skill Gap Analysis**  
  Compares the required skills from job listings with the user's current skills to suggest resources and highlight improvement areas.

- 🗂️ **Job Application Tracker**  
  Stores all job details (company, title, deadline, requirements) in a central Firebase database for easy tracking and reference.

- 🧠 **Recommendation System**  
  Suggests learning resources (e.g., from LeetCode, Forage) tailored to close skill gaps and prep for job roles.

- 🛎️ **Deadline & Schedule Reminders** *(Coming Soon)*  
  Set reminders for application deadlines and interviews.

- 🧾 **Resume Builder & Analyzer** *(Coming Soon)*  
  Helps create and evaluate resumes based on job requirements.

- 💬 **Chatbot & Voice Assistant** 
  Interact with Karyatra through text or voice for real-time updates, queries, and suggestions.


---

## 🚀 How It Works

1. **Bookmark a Job Posting**  
   → The Chrome Extension detects the job page and extracts the job title, company, deadline, and skills.

2. **Send to Backend**  
   → The extracted data is sent to a Python Flask backend where the job description is parsed and analyzed.

3. **Skill Comparison**  
   → Your existing skillset is compared with the job requirements and the system highlights gaps and recommends learning paths.

4. **Store and Track**  
   → All job entries are saved in a Firebase database for ongoing tracking and analysis.

---

## 🛠️ Tech Stack

- **Frontend**: HTML/CSS/JavaScript (Chrome Extension)
- **Backend**: Python + Flask
- **Database**: Firebase / Sqlite
- **Web Scraping**: Selenium 
- **AI/ML**: Basic NLP for skill extraction and matching

---

## 💡 Use Cases

- Tired of manually tracking job applications?  
- Unsure what skills you're missing for a dream role?  
- Want personalized preparation resources?

**Karyatra does it all — automatically, intelligently, and beautifully.**

---

## 📌 Future Plans

- ✅ Skill gap visualization with charts
- ✅ Resume recommendations based on job postings
- ⏳ AI-based interview Q&A generation
- ⏳ Chrome extension autosave on bookmark click
- ⏳ OAuth integration for personalized dashboards

---



