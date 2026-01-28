from mongoengine import Document, StringField, ListField, DateTimeField
from datetime import datetime

class KnowledgeBase(Document):
    category = StringField(required=True)  # 'guest', 'host', 'general'
    subcategory = StringField(required=False)
    question = StringField(required=True)
    answer = StringField(required=True)
    faq_id = StringField(required=False)
    source_file = StringField(required=False)
    tags = ListField(StringField())
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'Knowledge_Base',
        'indexes': ['category', 'subcategory', 'faq_id']
    }
