from mongoengine import Document, StringField, IntField, MapField, ListField

class RoadMap(Document):
    goal = StringField()
    level = StringField(required=False)
    description = StringField()
    estimated_hours = IntField()

    skills = MapField(field=ListField(StringField()))

    meta = {
        'collection' : 'Road_Map',
        'ordering': ['-id']
    }
