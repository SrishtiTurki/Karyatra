from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime
import traceback
import re
import PyPDF2  # For PDF parsing
import docx  # For DOCX parsing
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Download NLTK resources (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={
    r"/*": {"origins": "*"}  # Open CORS for all routes
})

# Constants
DOWNLOAD_FOLDER = "downloads"
MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx'}
MIN_SKILLS_THRESHOLD = 3  # Minimum number of skills to consider extraction successful

# Ensure download folder exists
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# Technical skills database (expand as needed)
TECHNICAL_SKILLS = {
    'programming_languages': [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'swift',
        'kotlin', 'go', 'rust', 'scala', 'perl', 'r', 'matlab', 'bash', 'powershell'
    ],
    'web_technologies': [
        'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'spring', 'bootstrap', 'jquery', 'sass', 'less', 'webpack', 'graphql', 'rest', 'json',
        'xml', 'nextjs', 'svelte', 'tailwind'
    ],
    'databases': [
        'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'redis', 'cassandra',
        'dynamodb', 'firebase', 'neo4j', 'elasticsearch', 'couchdb', 'mariadb'
    ],
    'cloud_and_devops': [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions',
        'terraform', 'ansible', 'chef', 'puppet', 'prometheus', 'grafana', 'ci/cd', 'serverless'
    ],
    'ai_and_data': [
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas',
        'numpy', 'matplotlib', 'seaborn', 'tableau', 'power bi', 'nlp', 'computer vision',
        'data mining', 'data analysis', 'big data', 'hadoop', 'spark', 'keras', 'opencv'
    ]
}

# Soft skills database
SOFT_SKILLS = [
    'communication', 'teamwork', 'leadership', 'problem solving', 'time management',
    'critical thinking', 'adaptability', 'creativity', 'emotional intelligence',
    'conflict resolution', 'project management', 'decision making', 'negotiation',
    'presentation', 'public speaking', 'attention to detail', 'customer service'
]

# Certifications database
CERTIFICATIONS = [
    'aws certified', 'azure certified', 'comptia', 'cisco ccna', 'pmp', 'scrum master',
    'google cloud certified', 'oracle certified', 'itil', 'cissp', 'ceh', 'rhce',
    'salesforce certified', 'microsoft certified', 'cka', 'google analytics'
]

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + " "
    except Exception as e:
        app.logger.error(f"Error extracting text from PDF: {str(e)}")
    return text

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + " "
    except Exception as e:
        app.logger.error(f"Error extracting text from DOCX: {str(e)}")
    return text

def extract_text_from_resume(file_path):
    """Extract text from resume file based on extension"""
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_ext in ['.doc', '.docx']:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_ext}")

def extract_skills_from_text(text):
    """Extract skills from text"""
    text = text.lower()
    words = word_tokenize(text)
    stop_words = set(stopwords.words('english'))
    filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
    
    # Initialize skills dictionary
    skills = {
        "Technical Skills": [],
        "Soft Skills": [],
        "Certifications": []
    }
    
    # Find technical skills
    for category, skill_list in TECHNICAL_SKILLS.items():
        for skill in skill_list:
            # Look for exact matches or matches with word boundaries
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                skills["Technical Skills"].append(skill.title())
    
    # Find soft skills
    for skill in SOFT_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            skills["Soft Skills"].append(skill.title())
    
    # Find certifications
    for cert in CERTIFICATIONS:
        if cert.lower() in text:
            skills["Certifications"].append(cert.title())
    
    return skills

def extract_skills_from_resume(resume_path):
    """Extract skills from resume"""
    try:
        # Extract text from resume
        resume_text = extract_text_from_resume(resume_path)
        if not resume_text.strip():
            raise ValueError("Failed to extract text from resume")
        
        # Extract skills from text
        skills = extract_skills_from_text(resume_text)
        
        # Validate we got some meaningful skills
        all_skills = set()
        for skill_list in skills.values():
            if skill_list:
                all_skills.update(skill_list)
                
        if len(all_skills) < MIN_SKILLS_THRESHOLD:
            app.logger.warning(f"Only {len(all_skills)} skills found - below minimum threshold")
            # Fall back to default skills for demo if needed
            if len(all_skills) == 0:
                app.logger.warning("No skills found, using sample skills")
                skills = {
                    "Technical Skills": ["Python", "JavaScript"],
                    "Soft Skills": ["Communication"],
                    "Certifications": []
                }
                
        return skills
        
    except Exception as e:
        app.logger.error(f"Skill extraction failed: {str(e)}")
        app.logger.error(traceback.format_exc())
        raise

@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "endpoints": {
            "/analyze_resume": "POST with resume file",
            "/skill_gap": "POST with resumeSkills"
        }
    })

@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():
    """Endpoint for resume file uploads"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": "Unsupported file type",
                "supported_types": list(ALLOWED_EXTENSIONS)
            }), 400
            
        try:
            # Save temporarily
            filename = f"upload_{datetime.now().timestamp()}{file_ext}"
            filepath = os.path.join(DOWNLOAD_FOLDER, filename)
            file.save(filepath)
            
            # Check file size
            if os.path.getsize(filepath) > MAX_RESUME_SIZE:
                os.remove(filepath)
                return jsonify({
                    "error": "File too large",
                    "max_size": f"{MAX_RESUME_SIZE/1024/1024}MB"
                }), 413
            
            # Analyze
            skills_data = extract_skills_from_resume(filepath)
            
            # Flatten the skills for the overall skills list
            all_skills = set()
            for skill_list in skills_data.values():
                all_skills.update(skill_list)
            
            return jsonify({
                "success": True,
                "skills": list(all_skills),
                "skills_by_section": {k: list(v) for k, v in skills_data.items()}
            })
            
        except Exception as e:
            return jsonify({
                "error": "Processing failed",
                "details": str(e)
            }), 400
            
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
                
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route("/skill_gap", methods=["POST"])
def get_skill_gap():
    """Mock skill gap analysis"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        resume_skills = data.get('resumeSkills', [])
        
        if not isinstance(resume_skills, list):
            return jsonify({"error": "resumeSkills must be an array"}), 400
            
        if len(resume_skills) < MIN_SKILLS_THRESHOLD:
            return jsonify({
                "error": f"Not enough skills provided (minimum {MIN_SKILLS_THRESHOLD} required)",
                "provided_skills": resume_skills
            }), 400
            
        # Enhanced mock data with all required fields
        demo_skill_gaps = {
            "LinkedIn": [
                {
                    "title": "Senior Python Developer at TechCorp",
                    "required_skills": ["Python", "Django", "AWS", "React"],
                    "your_skills": [skill for skill in ["Python", "React", "AWS"] if skill in resume_skills],
                    "missing_skills": [skill for skill in ["Django"] if skill not in resume_skills],
                    "match_percentage": 75.0,
                    "resume_skills": resume_skills
                },
                {
                    "title": "Frontend Developer at WebSolutions",
                    "required_skills": ["JavaScript", "React", "CSS", "HTML5"],
                    "your_skills": [skill for skill in ["JavaScript", "React"] if skill in resume_skills],
                    "missing_skills": [skill for skill in ["CSS", "HTML5"] if skill not in resume_skills],
                    "match_percentage": 50.0,
                    "resume_skills": resume_skills
                }
            ]
        }
        
        match_stats = {
            "LinkedIn": {
                "total_jobs": 2,
                "matched_jobs": 0,
                "match_rate": 0.0
            }
        }
        
        return jsonify({
            "success": True,
            "skill_gaps": demo_skill_gaps,
            "match_stats": match_stats,
            "summary": {
                "total_jobs": 2,
                "total_matched": 0,
                "overall_match_rate": 0.0,
                "resume_skills": resume_skills,
                "analyzed_at": datetime.now().isoformat(),
                "recommendations": [
                    "Focus on learning the missing skills highlighted above",
                    "Check our resources section for learning materials",
                    "Consider taking online courses for the skills you're missing"
                ]
            }
        })
            
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(port=5002, debug=True)