import json
from typing import Optional, List, Dict, BinaryIO

from ollama import Client

from config import settings
from rag_utils import RAGManager
# from web_search import WebSearchManager
from web_search_google import WebSearchGoogleManager


# Function to convert Ollama response to JSON serializable format
def convert_to_serializable(response):
    # Safely extract values using get(), provide default values if key doesn't exist
    serializable_response = {
        'model': response.get('model', ''),  # Default to empty string if 'model' doesn't exist
        'created_at': response.get('created_at', ''),
        'done': response.get('done', False),
        'done_reason': response.get('done_reason', None),
        'total_duration': response.get('total_duration', None),
        'load_duration': response.get('load_duration', None),
        'prompt_eval_count': response.get('prompt_eval_count', None),
        'prompt_eval_duration': response.get('prompt_eval_duration', None),
        'eval_count': response.get('eval_count', None),
        'eval_duration': response.get('eval_duration', None),
        'message': {
            'role': response.get('message', {}).get('role', ''),  # Nested get for 'message' and 'role'
            'content': response.get('message', {}).get('content', ''),
            'images': response.get('message', {}).get('images', None),
            'tool_calls': response.get('message', {}).get('tool_calls', None)
        }
    }

    return serializable_response


class OllamaService:
    def __init__(self,
                 address: str = f'{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}'):
        self._address = address
        self.rag_manager = RAGManager()
        # self.web_search_manager = WebSearchManager()
        self.web_search_google_manager = WebSearchGoogleManager()

    def get_chat_stream(self, query: str, model: str = None):
        client = Client(host=self._address)
        chat_messages: list[dict[str, str]] = [{'role': 'user', 'content': query}]

        stream = client.chat(model=model, messages=chat_messages, stream=True)

        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                content = {'content': chunk['message']['content']}
                yield f"data: {json.dumps(content)}\n\n"
    
    def process_file(self, file_bytes: bytes, file_name: str) -> List[str]:
        """Process a file and extract its contents"""
        return self.rag_manager.process_file(file_bytes, file_name)
    
    def get_context_enhanced_chat_stream(self, query: str, file_bytes: Optional[bytes] = None, 
                                        file_name: Optional[str] = None, search_internet: bool = False,
                                        model: str = None):
        client = Client(host=self._address)
        
        # Build context from file and/or web search
        context_parts = []
        search_sources = []
        
        # Process attached file if any
        if file_bytes and file_name:
            try:
                # Process the file and create vector DB
                self.process_file(file_bytes, file_name)
                
                # Get relevant context for the query using MMR and reranking if enabled
                file_context = self.rag_manager.get_relevant_context(
                    query=query,
                    use_mmr=settings.MMR_ENABLED,
                    use_reranking=settings.RERANKING_ENABLED,
                    top_k=settings.MMR_TOP_K,
                    fetch_k=settings.MMR_FETCH_K,
                    lambda_mult=settings.MMR_LAMBDA_MULT
                )
                if file_context:
                    context_parts.append(f"Information from file '{file_name}':\n{file_context}")
            except Exception as e:
                print(f"Error processing file: {e}")
                context_parts.append(f"Error analyzing file: {str(e)}")
        
        # Perform web search if enabled
        if search_internet:
            try:
                # Get raw search results to extract sources
                raw_results = self.web_search_google_manager.search(query)
                for result in raw_results:
                    # Store source information to send with the response
                    search_sources.append({
                        'title': result.get('title', 'Untitled'),
                        'link': result.get('link', '#')
                    })
                
                # Get formatted context for the model
                web_context = self.web_search_google_manager.get_search_context(query)
                if web_context:
                    context_parts.append(f"Information from web search:\n{web_context}")
            except Exception as e:
                print(f"Error during web search: {e}")
                context_parts.append("Error retrieving information from the web.")
        
        # Build the system prompt with context
        system_prompt = ""
        if context_parts:
            combined_context = "\n\n".join(context_parts)
            system_prompt = f"""You are a helpful AI assistant. Use the following information to answer the user's question, but don't explicitly mention that you're using this information unless asked. If the information doesn't contain the answer, just say you don't know and respond based on your training.

{combined_context}"""
        
        # Build chat messages
        chat_messages = []
        if system_prompt:
            chat_messages.append({'role': 'system', 'content': system_prompt})
        chat_messages.append({'role': 'user', 'content': query})
        
        # Get response from Ollama
        # Use provided model or default to the instance model
        model_to_use = model if model else self._model
        stream = client.chat(model=model_to_use, messages=chat_messages, stream=True)
        
        # Send sources in the first chunk if we have search results
        if search_internet and search_sources:
            first_chunk = {'content': '', 'search_sources': search_sources, 'model': model_to_use}
            yield f"data: {json.dumps(first_chunk)}\n\n"
        
        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                # For regular content chunks, just send the content
                content = {'content': chunk['message']['content'], 'model': model_to_use}
                yield f"data: {json.dumps(content)}\n\n"
