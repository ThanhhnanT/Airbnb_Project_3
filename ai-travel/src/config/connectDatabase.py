from mongoengine import connect
from dotenv import dotenv_values
from mongoengine.connection import  get_connection

def connect_db():
    config = dotenv_values(".env")
    uri = config.get("MONGGO_URL")
    db_name = "AI-Tutor"

    try:
        connect(
            db=db_name,
            host=uri,
            alias="default"
        )
        conn = get_connection()
        print("✅ Connected:", conn.server_info())
    except Exception as e:
        print("❌ MongoDB connection error:", e)