from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
from nltk.tokenize import RegexpTokenizer, word_tokenize
from nltk.corpus import stopwords
import nltk

nltk.download('punkt')
nltk.download('stopwords')

def get_job_description(job_url):
    try:
        # Set up Chrome options for headless mode
        chrome_options = Options()
        chrome_options.add_argument("--headless")

        # Set up the WebDriver for Chrome
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

        # Open the job URL
        driver.get(job_url)

        # Set up WebDriverWait to handle dynamic content
        wait = WebDriverWait(driver, 10)

        try:
            # Attempt to locate the job description by XPath
            job_description = wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="tab-detail"]/div[1]/ul[1]')))
            job_description=wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="mt4"]/div[1]/ul[1]')))

        except:
            # If XPath fails, try a fallback method by locating the body tag
            job_description = wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Extract and clean the job description text
        description_text = job_description.text.strip()
        print(description_text)
        
        # Close the WebDriver
        driver.quit()

        # Return the extracted job description
        return description_text

    except Exception as e:
        # Handle any errors during the scraping process
        print(f"Error scraping job description: {e}")
        return "Error: Unable to find job description."

def job_desc(job_url):
    return get_job_description(job_url)

job_url = ["https://www.linkedin.com/jobs/view/4095520697/?alternateChannel=search&refId=D1FlZhK%2BWfrgPgk5fFegyw%3D%3D&trackingId=LA50O6XEnMVXM8wqDVWblQ%3D%3D","https://unstop.com/internships/data-analytics-internship-bluebrain-solutions-1386525"]
for url in job_url:job_desc(url)
