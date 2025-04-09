import os
import tempfile
from typing import List, Optional

import pytesseract
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from pdf2image import convert_from_path

# Initialize embeddings
model_name = "all-MiniLM-L6-v2"
embeddings = HuggingFaceEmbeddings(model_name=model_name)

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

class RAGManager:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.vector_db = None
        
    def process_file(self, file_bytes: bytes, file_name: str) -> List[str]:
        """Process a file and return a list of chunks"""
        file_path = os.path.join(self.temp_dir, file_name)
        
        # Save the file temporarily
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
        
        # Process based on file type
        if file_name.lower().endswith('.pdf'):
            chunks = self._process_pdf(file_path)
        elif file_name.lower().endswith('.txt'):
            chunks = self._process_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_name}")
        
        # Create vector store
        docs = text_splitter.create_documents(chunks)
        self.vector_db = FAISS.from_documents(docs, embeddings)
        
        return chunks
    
    def _process_pdf(self, file_path: str) -> List[str]:
        """Process a PDF file and return extracted text"""
        try:
            # First try using PyPDFLoader
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            text_content = [doc.page_content for doc in documents]
            
            # If the extracted text is too small, try OCR
            if sum(len(text) for text in text_content) < 100:
                return self._ocr_pdf(file_path)
                
            return text_content
        except Exception as e:
            print(f"Error processing PDF with PyPDFLoader: {e}")
            # Fallback to OCR
            return self._ocr_pdf(file_path)
    
    def _ocr_pdf(self, file_path: str) -> List[str]:
        """Process a PDF file using OCR"""
        try:
            images = convert_from_path(file_path)
            text_content = []
            
            for i, image in enumerate(images):
                text = pytesseract.image_to_string(image)
                text_content.append(text)
                
            return text_content
        except Exception as e:
            print(f"Error performing OCR on PDF: {e}")
            return ["Error extracting text from PDF."]
    
    def _process_txt(self, file_path: str) -> List[str]:
        """Process a text file and return extracted text"""
        try:
            loader = TextLoader(file_path)
            documents = loader.load()
            return [doc.page_content for doc in documents]
        except Exception as e:
            print(f"Error processing text file: {e}")
            
            # Fallback: read file directly
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return [content]
            except Exception as e2:
                print(f"Error reading text file directly: {e2}")
                return ["Error extracting text from file."]
    
    def get_relevant_context(self, query: str, top_k: int = 5) -> Optional[str]:
        """Get relevant context from the vector store based on query"""
        if not self.vector_db:
            return None
        
        # Search the vector DB
        docs = self.vector_db.similarity_search(query, k=top_k)
        
        # Combine the relevant content
        if docs:
            context = "\n\n".join([doc.page_content for doc in docs])
            return context
        
        return None
