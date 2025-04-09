from typing import List, Dict, Optional
from duckduckgo_search import DDGS

class WebSearchManager:
    def __init__(self):
        self.ddgs = DDGS()
    
    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search the web using DuckDuckGo and return results
        
        Args:
            query: The search query
            max_results: Maximum number of results to return
            
        Returns:
            List of search results with title, body, and href
        """
        try:
            results = list(self.ddgs.text(query, max_results=max_results))
            print("Result ", results)
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
            body = result.get('body', 'No content available')
            href = result.get('href', '#')
            
            context_parts.append(f"[{i}] {title}\n{body}\nSource: {href}\n")
        
        return "\n".join(context_parts)
