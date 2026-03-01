from pydantic import BaseModel


class LiveJobOut(BaseModel):
    id: str
    title: str
    company: str | None = None
    location: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    is_remote: bool
    posted_date: str
    url: str
    skills: list[str]

