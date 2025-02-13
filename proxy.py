from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless=new")  # Run in headless mode
options.add_argument("--disable-usb")  # Disable USB-related features

# Initialize ChromeDriver
driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

driver.get("https://smpbkerala.in/herbal-data/")
print(driver.page_source)
driver.quit()
