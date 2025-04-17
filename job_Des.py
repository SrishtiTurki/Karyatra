from selenium import webdriver # type: ignore
from selenium.webdriver.common.by import By # type: ignore
from selenium.webdriver.chrome.service import Service # type: ignore
from selenium.webdriver.chrome.options import Options # type: ignore
from selenium.webdriver.support.ui import WebDriverWait # type: ignore
from selenium.webdriver.support import expected_conditions as EC # type: ignore
from selenium.common.exceptions import TimeoutException, NoSuchElementException # type: ignore
from webdriver_manager.chrome import ChromeDriverManager # type: ignore
import time
from urllib.parse import urlparse
import concurrent.futures
import spacy # type: ignore
from collections import Counter
import nltk # type: ignore
from nltk.corpus import stopwords # type: ignore
import sqlite3
import time
import sys

# Load spaCy NLP model for keyword extraction
nlp = spacy.load("en_core_web_sm")
# Download stopwords once
nltk.download("stopwords")

# NLTK's predefined stopwords list
nltk_stopwords = set(stopwords.words("english"))

# Enhanced custom stop words list (job-related terms and common noise)
custom_stopwords = {
    # General job terms
    "job", "work", "company", "description", "role", "team", "experience", 
    "skills", "requirements", "years", "apply", "responsibilities", 
    "looking", "jobs", "position", "opportunity", "candidate", 
    "industry", "field", "type", "location", "join", "hire", "hiring",
    "please", "email", "contact", "website", "http", "https", "com", "www",
    
    # Common noise words
    "ability", "including", "within", "across", "including", "including",
    "etc", "e.g", "i.e", "including", "including", "including", "including",
    "strong", "excellent", "good", "understanding", "knowledge", "level",
    "new", "use", "using", "used", "high", "quality", "various", "multiple",
    "day", "days", "time", "times", "year", "years", "month", "months",
    "need", "needs", "required", "requirement", "requirements", "skill",
    
    # Pronouns and determiners
    "you", "your", "we", "our", "us", "they", "their", "them", "this", "that",
    "these", "those", "some", "any", "all", "both", "either", "neither",
    
    # Common verbs
    "have", "has", "had", "do", "does", "did", "make", "makes", "made",
    "take", "takes", "took", "give", "gives", "gave", "get", "gets", "got",
    "need", "needs", "want", "wants", "like", "likes", "prefer", "prefers"
}

# Technical terms that might be too generic
generic_tech_terms = {
    "system", "systems", "technology", "technologies", "process", "processes",
    "method", "methods", "way", "ways", "thing", "things", "part", "parts",
    "area", "areas", "aspect", "aspects", "component", "components"
}

# Merge all stopword sets
all_stopwords = nltk_stopwords.union(custom_stopwords).union(generic_tech_terms)

# List of valid job-related categories to keep
JOB_RELATED_CATEGORIES = {
    "programming", "design", "marketing", "analysis", "engineering",
    "management", "development", "testing", "support", "administration",
    "finance", "accounting", "sales", "writing", "content", "education",
    "research", "science", "data", "security", "network", "cloud",
    "database", "web", "mobile", "graphics", "video", "audio",
    "architecture", "construction", "healthcare", "medical", "legal",
    "hr", "human resources", "recruiting", "customer", "service",
    "logistics", "supply chain", "manufacturing", "production",
    
    # Expanded Categories
    "cybersecurity", "artificial intelligence", "machine learning",
    "deep learning", "blockchain", "cryptocurrency", "biotechnology",
    "genetics", "pharmaceutical", "robotics", "automation",
    "environmental", "energy", "sustainability", "renewable energy",
    "social media", "public relations", "advertising", "brand management",
    "event planning", "hospitality", "tourism", "real estate",
    "interior design", "fashion", "retail", "e-commerce",
    "game development", "UI", "UX", "human-computer interaction",
    "aerospace", "automotive", "transportation", "marine",
    "quantitative analysis", "actuarial science", "investment",
    "venture capital", "private equity", "banking", "insurance",
    "legal compliance", "intellectual property", "regulatory affairs",
    "nonprofit", "ngo", "policy", "government", "public administration",
    "journalism", "publishing", "copywriting", "technical writing",
    "psychology", "counseling", "therapy", "coaching", "fitness",
    "sports management", "personal training", "nutrition",
    "veterinary", "agriculture", "forestry", "horticulture",
    "food science", "culinary", "restaurant", "catering",
    "film", "television", "broadcasting", "photography",
    "voice acting", "performing arts", "music", "theater",
    "museum", "archival", "history", "anthropology", "archaeology",
    "linguistics", "translation", "interpretation",
    "military", "law enforcement", "forensics", "intelligence",
    "emergency management", "firefighting", "paramedic",
    "aviation", "air traffic control", "meteorology"
}


def is_job_related(term):
    """Check if a term is job-related by comparing against known categories"""
    term = term.lower()
    return any(category in term for category in JOB_RELATED_CATEGORIES)

def extract_section(text, section_keywords=("requirements", "skills", "qualifications", "what we're looking for", "key qualifications", "must-have", "responsibilities", "responsibility")):
    """
    Extracts specific sections from a job description based on section keywords.
    """
    lines = text.split("\n")
    extracted_text = []
    capture = False

    for line in lines:
        line_lower = line.lower().strip()

        # Check if the line contains a section heading
        if any(keyword in line_lower for keyword in section_keywords):
            capture = True  # Start capturing text
            continue  # Skip the heading itself

        # Stop capturing at a new section or empty line
        if capture and (not line.strip() or ":" in line):
            break

        if capture:
            extracted_text.append(line.strip())

    # If no section was found, try to extract relevant sentences
    if not extracted_text:
        sentences = [sent.text.strip() for sent in nlp(text).sents]
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in section_keywords):
                extracted_text.append(sentence)

    return " ".join(extracted_text) if extracted_text else None

def extract_keywords(text):
    """
    Extracts job-related keywords using NLP with enhanced filtering.
    """
    if not text:  # Handle None or empty input
        return []
    
    doc = nlp(text.lower())  # Convert text to lowercase
    
    # Extract nouns, proper nouns, and adjectives that are likely job-relevant
    keywords = []
    for token in doc:
        # Skip stopwords, short words, and non-alphabetic tokens
        if (token.text in all_stopwords or 
            len(token.text) <= 2 or 
            not token.is_alpha):
            continue
            
        # Focus on nouns, proper nouns, and adjectives that modify them
        if token.pos_ in ["NOUN", "PROPN"] or (
            token.pos_ == "ADJ" and any(child.pos_ in ["NOUN", "PROPN"] for child in token.children)
        ):
            lemma = token.lemma_
            
            # Only keep terms that are job-related
            if is_job_related(lemma) or any(cat in lemma for cat in JOB_RELATED_CATEGORIES):
                keywords.append(lemma)
    
    # Count occurrences and return top keywords
    keyword_freq = Counter(keywords)
    
    # Filter out terms that appear only once unless they're clearly job-related
    top_keywords = [
        word for word, freq in keyword_freq.most_common(15)  # Get more candidates
        if freq > 1 or is_job_related(word)
    ][:10]  # Return top 10
    
    return top_keywords

def setup_driver(headless=True):
    """
    Set up and return a configured Selenium WebDriver instance with optimized settings
    """
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    
    # Performance optimization options
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")  # Disable images
    chrome_options.add_argument("--dns-prefetch-disable")
    
    # Add user agent
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36")
    
    # Experimental performance options
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    chrome_options.set_capability("pageLoadStrategy", "eager")  # Don't wait for all resources
    
    # Initialize WebDriver with a shorter page load timeout
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.set_page_load_timeout(15)  # Shorter timeout
    
    return driver

# [Previous imports remain the same...]

def get_job_description(job_url):
    """
    Scrapes job descriptions and extracts job titles, descriptions, and job-related keywords.
    """
    driver = None
    try:
        driver = setup_driver(headless=True)
        driver.get(job_url)
        time.sleep(1)

        domain = urlparse(job_url).netloc
        selectors = []
        title_selectors = []

        # Define selectors for both title and description based on domain
        if "linkedin.com" in domain:
            selectors.append((By.CSS_SELECTOR, ".show-more-less-html__markup"))
            title_selectors.append((By.CSS_SELECTOR, ".job-details-jobs-unified-top-card__job-title"))
        elif "indeed.com" in domain:
            selectors.append((By.ID, "jobDescriptionText"))
            title_selectors.append((By.CSS_SELECTOR, ".jobsearch-JobInfoHeader-title"))
        elif "glassdoor.com" in domain:
            selectors.append((By.CSS_SELECTOR, ".jobDescriptionContent"))
            title_selectors.append((By.CSS_SELECTOR, "[data-test='job-title']"))
        elif "monster.com" in domain:
            selectors.append((By.CSS_SELECTOR, ".job-description"))
            title_selectors.append((By.CSS_SELECTOR, ".job-title h1"))
        elif "unstop.com" in domain:
            selectors.append((By.XPATH, '//*[@id="tab-detail"]/div[1]/ul[1]'))
            title_selectors.append((By.TAG_NAME, "h1"))
        elif "internshala.com" in domain:
            selectors.append((By.CSS_SELECTOR, ".internship_details"))
            title_selectors.append((By.CSS_SELECTOR, ".profile_on_detail_page"))

        # Additional fallback selectors for description
        selectors.extend([
            (By.CSS_SELECTOR, "div.job-description"),
            (By.CSS_SELECTOR, ".description-container"),
            (By.ID, "job-description"),
            (By.XPATH, "//div[contains(@class, 'description')]"),
        ])

        # Additional fallback selectors for title
        title_selectors.extend([
            (By.CSS_SELECTOR, "h1.job-title"),
            (By.CSS_SELECTOR, ".job-title"),
            (By.CSS_SELECTOR, "h1.title"),
            (By.XPATH, "//h1[contains(@class, 'title')]"),
            (By.XPATH, "//h1[contains(text(), 'job') or contains(text(), 'position')]"),
        ])

        wait = WebDriverWait(driver, 3)
        description = None
        job_title = None

        # Try to extract job title
        for selector_type, selector in title_selectors:
            try:
                element = wait.until(EC.presence_of_element_located((selector_type, selector)))
                text = element.text.strip()
                if len(text) > 3:  # Minimum length for a title
                    job_title = text
                    break
            except (TimeoutException, NoSuchElementException):
                continue

        # Try to extract job description
        for selector_type, selector in selectors:
            try:
                element = wait.until(EC.presence_of_element_located((selector_type, selector)))
                text = element.text.strip()
                if len(text) > 50:
                    description = text
                    break
            except (TimeoutException, NoSuchElementException):
                continue

        # Fallback: Extract main page text for description
        if not description:
            try:
                description = driver.execute_script("return document.body.innerText;").strip()
            except:
                description = None

        if description:
            keywords = extract_keywords(description)  # Extract general keywords

            # Extract "requirements/skills" section
            requirements_text = extract_section(description)
            requirements_keywords = extract_keywords(requirements_text) if requirements_text else []

            return {
                "title": job_title,
                "description": description,
                "description_keywords": keywords,
                "requirements_text": requirements_text,
                "requirements_keywords": requirements_keywords
            }
        else:
            return {
                "title": job_title,
                "description": None, 
                "description_keywords": [],
                "requirements_text": None,
                "requirements_keywords": []
            }

    except Exception as e:
        print(f"⚠️ Error scraping {job_url}: {e}")
        return {
            "title": None,
            "description": None, 
            "description_keywords": [],
            "requirements_text": None,
            "requirements_keywords": []
        }
    finally:
        if driver:
            driver.quit()

def process_url(url):
    """Helper function for parallel processing"""
    result = get_job_description(url)
    return url, result  # Return the URL and the full result (description and keywords)

def extract_job_descriptions_parallel(job_urls, max_workers=4):
    """
    Extract job descriptions in parallel for much faster execution
    
    Args:
        job_urls: List of job posting URLs
        max_workers: Maximum number of parallel browser instances
        
    Returns:
        dict: Dictionary mapping URLs to their results (description and keywords)
    """
    results = {}
    
    # Use ThreadPoolExecutor for parallel processing
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all scraping tasks
        future_to_url = {executor.submit(process_url, url): url for url in job_urls}
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_url):
            url, result = future.result()
            results[url] = result
            if result["description"]:
                print(f"Scraped: {url}")
                print(f"Description Keywords: {result['description_keywords']}")
                print(f"Requirements Keywords: {result['requirements_keywords']}")
            else:
                print(f"Failed: {url}")
    
    return results

"""# Modified example usage to show title
if __name__ == "__main__":
    # List of job URLs to scrape
    job_urls = [
        "https://internshala.com/internship/detail/cinematography-internship-in-bangalore-at-filmbaker1739275560",
        "https://unstop.com/jobs/graphic-designer-icontent-1405985",
        "https://internshala.com/internship/detail/actor-internship-in-delhi-at-ayurveda-house-private-limited1740469189",
        "https://unstop.com/jobs/chemistry-teacher-one-tute-1132962",
        "https://www.linkedin.com/jobs/view/4170501753/?alternateChannel=search&refId=4ad62b4e-7108-4a17-9c8a-127badf44251&trackingId=L%2FkIM%2FGFTBe6%2BlrozU8n8g%3D%3D"
    ]
    
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
        else:
            print(f"\nFailed - {url}")
            print(f"Title (if found): {result['title']}")
"""