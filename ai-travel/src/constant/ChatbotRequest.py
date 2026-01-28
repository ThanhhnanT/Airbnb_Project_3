from pydantic import BaseModel, Field
from typing import Optional

class ChatbotRequest(BaseModel):
    question: str = Field(..., example="Làm thế nào để tìm kiếm phòng trên Airbnb?")
    user_type: str = Field(..., example="guest", description="Type of user: 'guest' or 'host'")
    category: Optional[str] = Field(None, example="search", description="Optional category for more specific answers")
    
    class Config:
        schema_extra = {
            "example": {
                "question": "Làm thế nào để tìm kiếm phòng trên Airbnb?",
                "user_type": "guest",
                "category": "search"
            }
        }
