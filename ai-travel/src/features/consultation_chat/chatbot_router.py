from fastapi import APIRouter, HTTPException
from src.constant.ChatbotRequest import ChatbotRequest
from src.features.consultation_chat.chatbot_controller import answer_question

router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot"]
)

@router.post("/ask_question")
async def ask_question(req: ChatbotRequest):
    """
    Ask a question about Airbnb usage.
    
    Request body:
    - question: The question to ask (string)
    - user_type: Type of user - 'guest' or 'host' (string)
    - category: Optional category for more specific answers (string)
    
    Example:
    {
        "question": "Làm thế nào để tìm kiếm phòng trên Airbnb?",
        "user_type": "guest",
        "category": "search"
    }
    """
    try:
        result = answer_question(req)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result.get("error", "Lỗi không xác định"))
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi máy chủ: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check for chatbot service"""
    return {
        "status": "ok",
        "service": "Airbnb Consultation Chatbot",
        "message": "Chatbot service is running"
    }
