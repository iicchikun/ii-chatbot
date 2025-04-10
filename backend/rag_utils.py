import os
import tempfile
from typing import List, Optional, Tuple

import numpy as np
import pytesseract
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.vectorstores.utils import maximal_marginal_relevance
from pdf2image import convert_from_path
from sentence_transformers import CrossEncoder

from config import settings

# Initialize embeddings
model_name = "all-MiniLM-L6-v2"
embeddings = HuggingFaceEmbeddings(model_name=model_name)

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.RAG_CHUNK_SIZE,
    chunk_overlap=settings.RAG_CHUNK_OVERLAP,
    length_function=len,
)

class RAGManager:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        self.vector_db = None
        # Initialize cross-encoder for reranking
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
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
    
    def get_relevant_context(self, query: str, top_k: int = 5, use_mmr: bool = True, use_reranking: bool = True, 
                         fetch_k: int = 30, lambda_mult: float = 0.7) -> Optional[str]:
        """Get relevant context from the vector store based on query with optional reranking and MMR
        
        Args:
            query: The query to search for
            top_k: Number of documents to return in the final result
            use_mmr: Whether to use Maximum Marginal Relevance to ensure diversity
            use_reranking: Whether to use the cross-encoder for reranking
            fetch_k: Number of documents to initially retrieve (should be larger than top_k)
            lambda_mult: Diversity-relevance tradeoff for MMR (0-1). Higher values prioritize relevance.
        """
        if not self.vector_db:
            return None
        
        # Fetch initial candidates (larger set for reranking)
        initial_docs = self.vector_db.similarity_search(query, k=fetch_k)
        
        # Apply reranking if enabled
        if use_reranking:
            print(f"Reranking {len(initial_docs)} documents...")
            # Prepare query-document pairs for reranking
            rerank_pairs = [[query, doc.page_content] for doc in initial_docs]
            
            # Get relevance scores
            rerank_scores = self.reranker.predict(rerank_pairs)
            
            # Sort documents by score
            scored_docs = list(zip(initial_docs, rerank_scores))
            scored_docs.sort(key=lambda x: x[1], reverse=True)
            
            # Get top documents after reranking (still more than final top_k for MMR)
            reranked_docs = [doc for doc, score in scored_docs[:min(15, len(scored_docs))]]  # Take top 15 for MMR
        else:
            reranked_docs = initial_docs[:min(15, len(initial_docs))]  # Use top initial docs without reranking
        
        # Apply MMR if enabled
        if use_mmr:
            # Get embeddings for the query
            query_embedding = np.array(embeddings.embed_query(query))
            
            # Process documents for MMR
            doc_texts = [doc.page_content for doc in reranked_docs]
            doc_embeddings = [np.array(embeddings.embed_query(text)) for text in doc_texts]
            
            # Apply MMR
            mmr_indices = maximal_marginal_relevance(
                query_embedding, 
                doc_embeddings, 
                k=min(top_k, len(doc_embeddings)), 
                lambda_mult=lambda_mult
            )
            
            # Get the filtered documents
            final_docs = [reranked_docs[i] for i in mmr_indices]
        else:
            # Use top reranked docs without diversity filtering
            final_docs = reranked_docs[:min(top_k, len(reranked_docs))]
        
        # Combine the relevant content
        if final_docs:
            context = "\n\n".join([doc.page_content for doc in final_docs])
            return context
        
        return None
