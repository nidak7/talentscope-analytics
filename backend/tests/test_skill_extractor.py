from app.analytics_engine.skill_extractor import SkillExtractor


def test_skill_extractor_finds_core_technologies():
    extractor = SkillExtractor()
    text = """
    We need a Senior Python engineer with FastAPI, Docker, AWS and CI/CD experience.
    Strong SQL skills plus React exposure are preferred.
    """

    skills = extractor.extract(text)

    assert "python" in skills
    assert "fastapi" in skills
    assert "docker" in skills
    assert "aws" in skills
    assert "ci/cd" in skills
    assert "sql" in skills
    assert "react" in skills

