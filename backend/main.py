import os
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from ollama_service import OllamaService
from config import settings


class ChatRequest(BaseModel):
    query: str
    model: Optional[str] = None


class ChatWithContextRequest(BaseModel):
    query: str
    search_internet: Optional[bool] = False


version = "v1"
app = FastAPI(version=version,
              title='II-Chatbot API',
              description='API for II-Chatbot that utilize FastAPI and Ollama')

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = OllamaService()


@app.get("/models")
async def get_available_models():
    """Get a list of available Ollama models"""
    return {"models": settings.AVAILABLE_MODELS}


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    print("Request received for /chat/stream")
    print("Request body model:", request.model)
    
    # Use model from request body or default from settings
    model_to_use = request.model if request.model in settings.AVAILABLE_MODELS else settings.OLLAMA_MODEL
    print("Using model:", model_to_use)
    return StreamingResponse(ai_service.get_chat_stream(request.query, model=model_to_use),
                             media_type="text/event-stream")


@app.post("/chat/stream-with-context")
async def chat_stream_with_context(
    query: str = Form(...),
    search_internet: bool = Form(False),
    model: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Stream chat responses with context from file and/or web search"""
    file_bytes = None
    file_name = None
    
    # Process file if uploaded
    if file:
        file_bytes = await file.read()
        file_name = file.filename
    
    # Use specified model or default from settings
    model_to_use = model if model in settings.AVAILABLE_MODELS else settings.OLLAMA_MODEL
    print("Stream with context using model:", model_to_use)
    
    return StreamingResponse(
        ai_service.get_context_enhanced_chat_stream(
            query=query,
            file_bytes=file_bytes,
            file_name=file_name,
            search_internet=search_internet,
            model=model_to_use
        ),
        media_type="text/event-stream"
    )
