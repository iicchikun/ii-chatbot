import os

from googleapiclient.discovery import build
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()

class WebSearchGoogleManager:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.cse_id = os.getenv('GOOGLE_CSE_ID')
        self.service = build('customsearch', 'v1', developerKey=self.api_key)
    
    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search the web using Google Custom Search and return results
        
        Args:
            query: The search query
            max_results: Maximum number of results to return
            
        Returns:
            List of search results with title, body, and href
        """
        try:
            results = list(self.service.cse().list(q=query, cx=self.cse_id, num=max_results).execute().get('items', []))
            return results
        except Exception as e:
            print(f"Error during web search: {e}")
            return []
    
    def get_search_context(self, query: str, max_results: int = 5) -> Optional[str]:
        """
        Get formatted context from web search results
        
        Args:
            query: The search query
            max_results: Maximum number of results to include
            
        Returns:
            Formatted string with search results
        """
        results = self.search(query, max_results)
        
        if not results:
            return "No relevant information found on the web."
            
        context_parts = []
        
        for i, result in enumerate(results, 1):
            title = result.get('title', 'Untitled')
            body = result.get('snippet', 'No content available')
            href = result.get('link', '#')
            
            context_parts.append(f"[{i}] {title}\n{body}\nSource: {href}\n")
        
        return "\n".join(context_parts)