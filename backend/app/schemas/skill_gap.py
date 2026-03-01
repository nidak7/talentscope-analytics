from pydantic import BaseModel, Field, field_validator


class SkillGapRequest(BaseModel):
    known_skills: list[str] = Field(min_length=1)
    role: str | None = Field(default=None, max_length=120)

    @field_validator("known_skills")
    @classmethod
    def normalize_input_skills(cls, value: list[str]) -> list[str]:
        cleaned = [skill.strip().lower() for skill in value if skill.strip()]
        if not cleaned:
            raise ValueError("known_skills cannot be empty")
        return cleaned


class MissingSkill(BaseModel):
    skill: str
    demand_count: int


class SkillGapResponse(BaseModel):
    matched_skills: list[str]
    missing_skills: list[MissingSkill]
    demand_score: float
    market_heat_score: float

