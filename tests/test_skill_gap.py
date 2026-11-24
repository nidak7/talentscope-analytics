"""Small checks for the skill gap function. Run with: python -m pytest tests"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analysis"))
import skill_gap as sg  # noqa: E402

EXAMPLE = ["SQL", "Excel", "Power BI", "Python", "statistics"]


def test_example_candidate_data_scientist():
    result = sg.skill_gap("data scientist", EXAMPLE)
    assert result["coverage_pct"] == 49.6
    assert result["missing"][0] == "machine learning"


def test_no_skills_gives_zero():
    assert sg.skill_gap("data analyst", [])["coverage_pct"] == 0


def test_all_top_skills_gives_hundred():
    demand = sg.load_demand()
    top8 = (demand[(demand["role"] == "data analyst") & (demand["kind"] == "skill")]
            .sort_values(["postings", "term"], ascending=[False, True]).head(8)["term"].tolist())
    assert sg.skill_gap("data analyst", top8)["coverage_pct"] == 100


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
