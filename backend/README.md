# ii-chatbot v1 - Backend

A powerful AI chatbot backend built with FastAPI and Ollama, featuring RAG capabilities, web search integration, and multi-model support.

## Features

- Streaming responses from Ollama models
- RAG (Retrieval-Augmented Generation) for document processing
- Google Search integration for real-time information
- File attachment support (PDF, TXT)
- Multiple Ollama model selection

## Prerequisites

1. Go to https://ollama.com and install Ollama on your system
2. Pull the required models:
   ```shell
   ollama pull deepseek-r1:latest
   ollama pull gemma3:latest
   ```
3. Ensure Ollama is running as a server on port: `11434`

## Installation

1. Create and activate a virtual environment:

   **For Linux/macOS:**
   ```shell
   python3 -m venv ./.venv
   source ./.venv/bin/activate
   ```

   **For Windows:**
   ```shell
   python -m venv .venv
   .venv\Scripts\activate
   ```

2. Install all required dependencies from requirements.txt:
   ```shell
   pip install -r requirements.txt
   ```

## Configuration

1. Create a `.env` file in the root directory with the following content:
   ```
   GOOGLE_CSE_ID='your_google_cse_id'  # Required for Google Search
   GOOGLE_API_KEY='your_google_api_key'  # Required for Google Search
   ```

2. Customize the settings in `config.py` if needed (default model, available models, etc.)

## Running the API

Start the server with the following command:

```shell
uvicorn server:app --host=127.0.0.1 --port=8000 --reload
```

The API will be available at:
- API Endpoints: `http://127.0.0.1:8000/`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

## API Endpoints

- `GET /models` - Get available Ollama models
- `POST /chat/stream` - Stream chat completions (basic chat)
- `POST /chat/stream-with-context` - Stream chat completions with context from file attachments and/or web search

## Testing

You can test the API directly using the Swagger UI at `http://127.0.0.1:8000/docs` or connect to it using the frontend application.
