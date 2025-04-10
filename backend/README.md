# ii-chatbot v1 - Backend

A powerful AI chatbot backend built with FastAPI and Ollama, featuring enhanced RAG capabilities with ChromaDB, MMR, and reranking, web search integration, and multi-model support.

## Features

- Streaming responses from Ollama models
- Advanced RAG (Retrieval-Augmented Generation) implementation:
  - ChromaDB vector database with persistence
  - Maximum Marginal Relevance (MMR) for diverse results
  - Cross-encoder reranking for improved relevance
  - Document metadata tracking and management
- Google Search integration for real-time information
- File attachment support (PDF, TXT) with OCR capabilities
- Multiple Ollama model selection

## Prerequisites

1. Go to https://ollama.com and install Ollama on your system
2. Pull the required models:
   ```shell
   ollama pull deepseek-r1:latest
   ollama pull gemma3:latest
   ```
3. Ensure Ollama is running as a server on port: `11434`
4. Make sure you have sufficient disk space for ChromaDB persistence (stores embeddings and metadata)

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

   The requirements include:
   - `chromadb` - Vector database for persistence
   - `sentence-transformers` - For reranking with cross-encoders
   - `langchain` - For document processing and RAG components

## Configuration

1. Create a `.env` file in the root directory with the following content:
   ```
   OLLAMA_HOST_URL='http://127.0.0.1'  # Ollama server address
   OLLAMA_PORT=11434                   # Ollama server port
   GOOGLE_CSE_ID='your_google_cse_id'  # Required for Google Search
   GOOGLE_API_KEY='your_google_api_key'  # Required for Google Search
   ```

2. Customize the settings in `config.py` if needed:
   - **Ollama settings**: Default model, available models
   - **RAG settings**: Chunk size and overlap for document processing
   - **MMR settings**: Enable/disable MMR, fetch count, top results count, diversity parameter
   - **Reranking settings**: Enable/disable reranking, model selection
   - **ChromaDB settings**: Persistence directory, collection name, distance function

## Running the API

Start the server with the following command:

```shell
uvicorn main:app --reload
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

## Advanced Features

### ChromaDB Vector Store

The application uses ChromaDB for persistent vector storage with the following benefits:

- **Persistence**: Document embeddings are stored on disk in the `db/chroma` directory
- **Metadata**: Each document chunk includes metadata (source, chunk ID, type)
- **Configurable**: Distance metrics and collection settings can be customized

### Maximum Marginal Relevance (MMR)

MMR is implemented to balance relevance and diversity in retrieved documents:

- Configurable via `MMR_LAMBDA_MULT` parameter (0.7 by default)
- Higher values prioritize relevance, lower values prioritize diversity
- Can be enabled/disabled via the `MMR_ENABLED` setting

### Cross-Encoder Reranking

A cross-encoder model improves retrieval accuracy:

- Uses sentence-transformers for more precise relevance scoring
- Applied after initial retrieval but before MMR
- Configurable via `RERANKING_ENABLED` and `RERANKING_MODEL` settings
