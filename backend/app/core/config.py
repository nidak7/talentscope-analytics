from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TalentScope Analytics API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    mongo_uri: str = Field(..., alias="MONGO_URI")
    mongo_db_name: str = Field(default="talentscope", alias="MONGO_DB_NAME")

    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_minutes: int = Field(default=60, alias="ACCESS_TOKEN_MINUTES")

    adzuna_app_id: str = Field(..., alias="ADZUNA_APP_ID")
    adzuna_app_key: str = Field(..., alias="ADZUNA_APP_KEY")
    adzuna_country: str = Field(default="us", alias="ADZUNA_COUNTRY")
    adzuna_results_per_page: int = Field(default=50, alias="ADZUNA_RESULTS_PER_PAGE")
    adzuna_pages_per_sync: int = Field(default=2, alias="ADZUNA_PAGES_PER_SYNC")
    sync_keywords: str = Field(
        default="software engineer,data analyst,devops engineer",
        alias="SYNC_KEYWORDS",
    )
    sync_interval_minutes: int = Field(default=180, alias="SYNC_INTERVAL_MINUTES")
    fallback_public_pages: int = Field(default=3, alias="FALLBACK_PUBLIC_PAGES")

    cache_ttl_seconds: int = Field(default=300, alias="CACHE_TTL_SECONDS")
    spacy_model: str = Field(default="en_core_web_sm", alias="SPACY_MODEL")

    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("sync_keywords", "cors_origins", mode="before")
    @classmethod
    def normalize_csv_strings(cls, value: str | list[str]) -> str:
        if isinstance(value, list):
            return ",".join([item.strip() for item in value if item.strip()])
        return value

    @property
    def sync_keyword_list(self) -> list[str]:
        return [item.strip() for item in self.sync_keywords.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def has_reliable_job_api_credentials(self) -> bool:
        blocked_values = {"", "demo-id", "demo-key", "your-adzuna-app-id", "your-adzuna-app-key"}
        return self.adzuna_app_id not in blocked_values and self.adzuna_app_key not in blocked_values


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
