from fastapi import FastAPI
from dotenv import dotenv_values
from fastapi.middleware.cors import CORSMiddleware
from src.features.ai_schedule.schedule_controller import GenSchedule
from src.constant.ScheduleType import Schedule
from src.config.connectDatabase import  connect_db


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

config = dotenv_values(".env")

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connect_db()

@app.get("/")
def root():
    return {"Hello": "World"}

@app.post("/generate_schedule")
async def query_schedule(req: Schedule):
    return GenSchedule(req)
