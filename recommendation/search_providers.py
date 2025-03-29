import os
import requests
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from duckduckgo_search import DDGS
from googleapiclient.discovery import build
from bs4 import BeautifulSoup

class SearchProvider(ABC):
    """Abstract base class for all search providers"""
    
    @abstractmethod
    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for resources based on the query
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            List of resource dictionaries
        """
        pass

class DuckDuckGoProvider(SearchProvider):
    """DuckDuckGo search provider implementation"""
    
    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(query, max_results=limit))
                
                for result in ddg_results:
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("href", ""),
                        "description": result.get("body", ""),
                        "source": "DuckDuckGo",
                        "resource_type": "article"
                    })
                    
        except Exception as e:
            print(f"Error searching DuckDuckGo: {e}")
            
        return results

class YouTubeProvider(SearchProvider):
    """YouTube search provider implementation"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=self.api_key)
        
    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            search_response = self.youtube.search().list(
                q=query,
                part='snippet',
                maxResults=limit,
                type='video'
            ).execute()
            
            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                snippet = item['snippet']
                
                results.append({
                    "title": snippet.get('title', ''),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "description": snippet.get('description', ''),
                    "source": "YouTube",
                    "resource_type": "video",
                    "thumbnail": snippet.get('thumbnails', {}).get('high', {}).get('url', '')
                })
                
        except Exception as e:
            print(f"Error searching YouTube: {e}")
            
        return results

class GitHubProvider(SearchProvider):
    """GitHub search provider implementation"""
    
    def __init__(self, token: Optional[str] = None):
        self.headers = {}
        if token:
            self.headers["Authorization"] = f"token {token}"
    
    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        results = []
        try:
            response = requests.get(
                "https://api.github.com/search/repositories",
                params={
                    "q": query,
                    "sort": "stars",
                    "order": "desc",
                    "per_page": limit
                },
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                for item in data.get('items', []):
                    results.append({
                        "title": item.get('name', ''),
                        "url": item.get('html_url', ''),
                        "description": item.get('description', ''),
                        "source": "GitHub",
                        "resource_type": "repository",
                        "stars": item.get('stargazers_count', 0)
                    })
            
        except Exception as e:
            print(f"Error searching GitHub: {e}")
            
        return results