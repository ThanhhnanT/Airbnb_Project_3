from mongoengine import Document, StringField, DateTimeField, DictField, ListField
from datetime import datetime

class ChatHistory(Document):
    user_id = StringField(required=False)
    user_type = StringField(required=True)  # 'guest' or 'host'
    question = StringField(required=True)
    answer = StringField(required=True)
    category = StringField(required=False)
    sources = ListField(StringField())
    confidence = DictField()
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'Chat_History',
        'ordering': ['-created_at']
    }
