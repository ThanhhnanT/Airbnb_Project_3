from langchain_community.document_loaders import PyPDFLoader, TextLoader, WebBaseLoader, YoutubeLoader
from typing import List, Union, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import dotenv_values
from langchain.docstore.document import Document
import os
import json

config = dotenv_values(".env")

def load_json_faq(file_path: str) -> List[Document]:
    """Load FAQ from JSON file and create documents for each Q&A pair"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        documents = []
        category = data.get('category', 'general')
        
        if 'faqs' in data:
            for faq in data['faqs']:
                question = faq.get('question', '')
                answer = faq.get('answer', '')
                faq_id = faq.get('id', '')
                
                # Tạo document từ cặp Q&A
                content = f"Q: {question}\nA: {answer}"
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": file_path,
                        "file_type": "FAQ",
                        "category": category,
                        "subcategory": data.get('subcategory', ''),
                        "question": question,
                        "answer": answer,
                        "faq_id": faq_id,
                        "domain": "airbnb"
                    }
                )
                documents.append(doc)
        
        return documents
    
    except Exception as e:
        print(f"Error loading JSON FAQ {file_path}: {e}")
        return []

def load_document(file_path: str, level: str = "general", domain: str = "airbnb") -> List[Document]:
    try:
        # Kiểm tra xem file là JSON FAQ
        if file_path.lower().endswith(".json"):
            return load_json_faq(file_path)
        
        # Chọn loader phù hợp
        if file_path.startswith("http://") or file_path.startswith("https://"):
            loader = YoutubeLoader.from_url(file_path) if "youtube.com" in file_path else WebBaseLoader(file_path)
        elif file_path.lower().endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path, encoding="utf-8")

        # Load raw data
        data = loader.load()

        # Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=int(config.get('CHUNK_SIZE', 1000)),
            chunk_overlap=int(config.get('CHUNK_OVERLAP', 200))
        )
        chunks = text_splitter.split_documents(data)

        # Chuẩn hóa metadata
        file_name = os.path.splitext(os.path.basename(file_path))[0]
        domain_clean = domain.strip().lower()
        level_clean = level.strip().lower()
        file_type_clean = file_name.strip()

        for c in chunks:
            c.metadata["source"] = file_path
            c.metadata["file_type"] = file_type_clean
            c.metadata["level"] = level_clean
            c.metadata["domain"] = domain_clean

        return chunks

    except Exception as e:
        print(f"Error loading document {file_path}: {e}")
        return []
