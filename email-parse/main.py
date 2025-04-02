from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Get API key
api_key = os.getenv('GEMINI_API_KEY')
print(api_key)

