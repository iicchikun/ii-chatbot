from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_HOST: str = 'http://127.0.0.1'
    OLLAMA_PORT: int = 11434
    OLLAMA_MODEL: str = 'deepseek-r1:latest'
    
    # Available models for the dropdown selector
    AVAILABLE_MODELS: list = ['deepseek-r1:latest', 'gemma3:latest']

    # class Config:
    #     env_file = ".env"


# Load settings
settings = Settings()
