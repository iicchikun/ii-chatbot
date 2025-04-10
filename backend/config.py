import os

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Ollama settings
    OLLAMA_HOST: str = os.getenv('OLLAMA_HOST_URL', 'http://127.0.0.1')
    OLLAMA_PORT: int = os.getenv('OLLAMA_PORT', 11434)
    OLLAMA_MODEL: str = 'deepseek-r1:latest'
    
    # Available models for the dropdown selector
    AVAILABLE_MODELS: list = ['deepseek-r1:latest', 'gemma3:latest']
    
    # RAG settings
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 200
    
    # MMR settings
    MMR_ENABLED: bool = True  # Enable/disable MMR retrieval
    MMR_FETCH_K: int = 30     # Number of documents to consider before filtering
    MMR_TOP_K: int = 5        # Number of documents to return after MMR filtering
    MMR_LAMBDA_MULT: float = 0.7  # Diversity-relevance tradeoff (0-1). Higher values prioritize relevance
    
    # Reranking settings
    RERANKING_ENABLED: bool = True  # Enable/disable reranking
    RERANKING_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"  # Model to use for reranking
    
    # ChromaDB settings
    CHROMA_PERSIST_DIRECTORY: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db/chroma")
    CHROMA_COLLECTION_NAME: str = "ii-chatbot-collection"
    CHROMA_DISTANCE_FUNCTION: str = "cosine"


# Load settings
settings = Settings()
