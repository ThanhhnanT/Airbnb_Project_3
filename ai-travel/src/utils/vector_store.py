from typing import List
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document
import sys
from src.utils.custom_emb import create_embeddings
from dotenv import dotenv_values

config = dotenv_values(".env")

def create_vector_store(
    document: List[Document], embeddings: HuggingFaceEmbeddings, db_path: str = config['VECTORDB_PATH']
) -> Chroma:

    try:
        vector_store = Chroma.from_documents(document, embeddings, persist_directory=db_path)
        return vector_store
    except Exception as e:
        print(f"Error creating vector store: {e}")
        sys.exit(1)  # Exit if vector store creation fails

def load_vector_store(
    db_path: str = config['VECTORDB_PATH'], embeddings: HuggingFaceEmbeddings = None
) -> Chroma:
    try:
        if embeddings is None:
            embeddings = create_embeddings()
        vector_store = Chroma(
            persist_directory=db_path, embedding_function=embeddings
        )  # Use embedding_function
        return vector_store
    except Exception as e:
        print(f"Error loading vector store: {e}")
        sys.exit(1)  # Exit if loading fails

def get_similar_docs(query: str, vector_store: Chroma, level: str, file_type: str, domain:str, k: int = 5) -> List[str]:
    try:
        return vector_store.similarity_search(
            query,
            k=k,
            filter={
                "$and": [
                    {"domain": {"$eq": domain}},
                    {"level": {"$eq": level}},
                    {"file_type": {"$eq": file_type}},
                ]
            }
        )
    except Exception as e:
        print(f"Error retrieving similar documents: {e}")
        return []

