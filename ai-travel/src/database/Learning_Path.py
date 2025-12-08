from mongoengine import Document, StringField, IntField, ListField, EmbeddedDocument, EmbeddedDocumentField, DictField

class Question(EmbeddedDocument):
    id = StringField()
    question_text = StringField()
    options = ListField(StringField())
    correct_answer = StringField()
    level = StringField()


class Day(EmbeddedDocument):
    day = IntField()
    skill = StringField()
    subskill = StringField()
    youtube_links = StringField()
    theory = StringField()
    question_review = ListField(EmbeddedDocumentField(Question))


class LearningPath(Document):
    user_id = StringField()
    course = StringField()
    schedule = ListField(EmbeddedDocumentField(Day))

    meta = {
        'collection': 'Learning_Path',
        'ordering': ['user_id']
    }