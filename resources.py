import time
import re
from playwright.sync_api import sync_playwright

def search_forage_links(company_name):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Run in headless mode
        page = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")

        # Open DuckDuckGo
        page.goto("https://duckduckgo.com/", wait_until="domcontentloaded")

        # Search for "Forage [Company Name]"
        search_query = f"Forage {company_name}"
        page.fill("input[name='q']", search_query)
        page.press("input[name='q']", "Enter")

        # Wait for search results to load
        page.wait_for_selector("article a[href]", timeout=20000)

        # Extract all links
        all_links = page.eval_on_selector_all("article a[href]", "elements => elements.map(e => e.href)")

        # Filter only forage.com links
        forage_links = [link for link in all_links if "forage.com" in link]

        # Extract proper endpoints
        formatted_links = []
        for link in forage_links:
            match = re.search(r'forage\.com/([\w\-]+)', link)
            if match:
                endpoint = match.group(1)
                formatted_links.append(f"forage.com/{endpoint}")

        browser.close()
        return formatted_links

# Define company name
company_name = "Google"  # Change this for different companies

# Get relevant Forage links
results = search_forage_links(company_name)

# Print results
if results:
    print("\nForage Links for", company_name, ":\n")
    for idx, link in enumerate(results, start=1):
        print(f"{idx}. {link}")
else:
    print(f"No Forage links found for {company_name}.")
