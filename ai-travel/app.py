from fastapi import FastAPI
from dotenv import dotenv_values
from fastapi.middleware.cors import CORSMiddleware
from src.features.ai_schedule.schedule_controller import GenSchedule
from src.constant.ScheduleType import Schedule
from src.config.connectDatabase import connect_db
from src.features.consultation_chat.chatbot_router import router as chatbot_router


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

config = dotenv_values(".env")

app = FastAPI(
    title="AI Travel & Consultation API",
    description="API for learning paths and Airbnb consultation chatbot",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connect_db()

# Include routers
app.include_router(chatbot_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to AI Travel & Consultation API",
        "services": {
            "chatbot": "/chatbot/ask_question - Ask questions about Airbnb",
            "learning": "/generate_schedule - Generate learning schedules",
            "health": "/chatbot/health - Chatbot health check"
        }
    }

@app.post("/generate_schedule")
async def query_schedule(req: Schedule):
    return GenSchedule(req)
