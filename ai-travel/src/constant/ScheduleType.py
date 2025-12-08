from pydantic import BaseModel, Field

class Schedule(BaseModel):
    goal: str = Field(..., example="I want to learn Computer Vision")
    level: str | None = Field(None, example="Beginner")
    discription: str | None = Field(None, example="This is a course to learn Computer Vision step by step")
    estimated_hours: int = Field(..., example=40)

    class Config:
        schema_extra = {
            "example": {
                "goal": "I want to learn Computer Vision",
                "level": "Beginner",
                "discription": "This is a course to learn Computer Vision step by step",
                "estimated_hours": 40
            }
        }
