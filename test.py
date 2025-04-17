from dotenv import load_dotenv # type: ignore
import os

load_dotenv()  # Load variables from .env file

SERP_API_KEY = os.getenv("SERP_API_KEY")

print(f"[DEBUG] API Key: {SERP_API_KEY}")