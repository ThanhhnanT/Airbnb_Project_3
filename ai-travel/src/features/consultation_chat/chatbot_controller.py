from src.utils.load_documents import load_document
from src.utils.vector_store import load_vector_store, create_vector_store
from dotenv import dotenv_values
from src.utils.custom_emb import create_embeddings
from src.utils.initialize_llms import initialize_llm
from src.utils.create_agent import create_agent
from langchain.memory import ConversationBufferMemory
import sys
import os
from src.constant.ChatbotRequest import ChatbotRequest
import json
import re
from src.database.ChatHistory import ChatHistory
import glob

config = dotenv_values(".env")

def initialize_chatbot_vector_store():
    """Initialize or load the chatbot vector store from FAQ JSON files"""
    try:
        embeddings = create_embeddings()
        vector_db_path = config.get('VECTORDB_PATH_CHAT', './data/vector_db_chat')
        
        # Check if vector store already exists
        if os.path.exists(vector_db_path):
            print(f"Loading existing vector store from {vector_db_path}")
            vector_store = load_vector_store(db_path=vector_db_path, embeddings=embeddings)
        else:
            print(f"Creating new vector store at {vector_db_path}")
            # Load all FAQ JSON files
            documents = []
            guides_path = os.path.join(os.path.dirname(__file__), "../../data/guides")
            
            json_files = glob.glob(os.path.join(guides_path, "*.json"))
            print(f"Found {len(json_files)} FAQ files to load")
            
            for json_file in json_files:
                print(f"Loading FAQ from {json_file}")
                docs = load_document(json_file)
                if docs:
                    documents.extend(docs)
                    print(f"Loaded {len(docs)} Q&A pairs from {os.path.basename(json_file)}")
            
            if not documents:
                print("Warning: No documents loaded for vector store")
                return None
            
            print(f"Creating vector store with {len(documents)} total documents")
            vector_store = create_vector_store(documents, embeddings, db_path=vector_db_path)
        
        return vector_store
    
    except Exception as e:
        print(f"Error initializing chatbot vector store: {e}")
        return None

def answer_question(req: ChatbotRequest):
    """
    Answer user questions about Airbnb using the chatbot agent.
    
    Args:
        req: ChatbotRequest containing question, user_type, and optional category
    
    Returns:
        Dictionary with answer, sources, and metadata
    """
    print(f"Processing chatbot request: {req}")
    
    try:
        # Initialize embeddings and vector store
        embeddings = create_embeddings()
        vector_store = initialize_chatbot_vector_store()
        
        if vector_store is None:
            return {"error": "Vector store not initialized", "answer": "Xin lỗi, không thể khởi tạo cơ sở dữ liệu. Vui lòng thử lại."}
        
        # Initialize LLM and agent
        llm = initialize_llm()
        memory = ConversationBufferMemory(memory_key="chat_history", input_key="input")
        
        # Create chatbot agent with 'chatbot' mode
        agent = create_agent(
            domain="airbnb",
            level="general",
            llm=llm,
            vector_store=vector_store,
            memory=memory,
            mode="chatbot"
        )
        
        # Prepare the prompt for the agent
        user_type_text = "khách hàng (guest)" if req.user_type.lower() == "guest" else "chủ nhà (host)"
        
        prompt = f"""
        Bạn là một trợ lý tư vấn Airbnb. Người dùng là một {user_type_text}.
        
        Câu hỏi của người dùng: "{req.question}"
        """
        
        if req.category:
            prompt += f"\nDanh mục: {req.category}"
        
        prompt += """
        
        HƯỚNG DẪN:
        - Sử dụng các công cụ (retrieval tools) để tìm thông tin liên quan từ cơ sở dữ liệu Airbnb.
        - Cung cấp câu trả lời chi tiết, thân thiện và hữu ích bằng tiếng Việt.
        - Nếu thông tin không khả dụng, hãy nói rõ ràng và đề xuất các cách khác.
        - Luôn cung cấp các bước cụ thể nếu đó là hướng dẫn.
        - Kết thúc bằng câu hỏi theo dõi để giúp người dùng thêm nữa.
        """
        
        # Run the agent
        response = agent.run(prompt.strip())
        
        # Parse response and extract sources
        sources = []
        if "retrieval_" in response.lower():
            sources = ["Airbnb FAQ Database"]
        
        # Save to chat history
        chat_record = ChatHistory(
            user_type=req.user_type.lower(),
            question=req.question,
            answer=response,
            category=req.category or "general",
            sources=sources,
            confidence={"model": "groq-llama3.3", "timestamp": str(__import__("datetime").datetime.now())}
        )
        chat_record.save()
        
        return {
            "answer": response,
            "sources": sources,
            "category": req.category or "general",
            "user_type": req.user_type,
            "related_questions": generate_related_questions(req.question, req.user_type)
        }
    
    except Exception as e:
        print(f"Error processing chatbot request: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "answer": "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
            "user_type": req.user_type
        }

def generate_related_questions(question: str, user_type: str) -> list:
    """Generate related questions based on the user's question and type"""
    # Simple heuristic-based related questions
    related = []
    
    question_lower = question.lower()
    
    # Guest-related suggestions
    if user_type.lower() == "guest":
        if "tìm kiếm" in question_lower or "search" in question_lower:
            related.append("Làm thế nào để lọc danh sách theo tiện nghi?")
            related.append("Tôi nên để ý những gì khi xem danh sách?")
        elif "đặt phòng" in question_lower or "booking" in question_lower:
            related.append("Các phương thức thanh toán nào được chấp nhận?")
            related.append("Tôi có thể hủy đặt phòng không?")
        elif "thanh toán" in question_lower or "payment" in question_lower:
            related.append("Airbnb chấp nhận những phương thức thanh toán nào?")
            related.append("Tiền hoàn lại sẽ được gửi khi nào?")
        elif "review" in question_lower or "đánh giá" in question_lower:
            related.append("Làm thế nào để viết bài đánh giá?")
            related.append("Tôi có thể sửa hoặc xóa đánh giá không?")
    
    # Host-related suggestions
    elif user_type.lower() == "host":
        if "danh sách" in question_lower or "listing" in question_lower:
            related.append("Ảnh chất lượng cao như thế nào?")
            related.append("Làm thế nào để đặt giá phòng hợp lý?")
        elif "giá" in question_lower or "pricing" in question_lower:
            related.append("Tôi nên sử dụng chính sách hủy nào?")
            related.append("Làm thế nào để tăng tỷ lệ đặt phòng?")
        elif "thanh toán" in question_lower or "payout" in question_lower:
            related.append("Tôi sẽ nhận được thanh toán khi nào?")
            related.append("Phí dịch vụ của Airbnb là bao nhiêu?")
        elif "quản lý" in question_lower or "manage" in question_lower:
            related.append("Làm thế nào để giao tiếp tốt với khách?")
            related.append("Tôi nên chuẩn bị gì cho khách?")
    
    return related[:3]  # Return top 3 related questions
