from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ollama settings
    OLLAMA_HOST: str = 'http://127.0.0.1'
    OLLAMA_PORT: int = 11434
    OLLAMA_MODEL: str = 'deepseek-r1:latest'
    
    # Available models for the dropdown selector
    AVAILABLE_MODELS: list = ['deepseek-r1:latest', 'gemma3:latest']
    
    # RAG settings
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 200
    
    # MMR settings
    MMR_ENABLED: bool = True  # Enable/disable MMR retrieval
    MMR_FETCH_K: int = 15     # Number of documents to consider before filtering
    MMR_TOP_K: int = 5        # Number of documents to return after MMR filtering
    MMR_LAMBDA_MULT: float = 0.7  # Diversity-relevance tradeoff (0-1). Higher values prioritize relevance

    # class Config:
    #     env_file = ".env"


# Load settings
settings = Settings()
