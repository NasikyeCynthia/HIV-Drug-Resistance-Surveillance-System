from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    database_url: str
    jwt_secret: str
    access_token_minutes: int = 15       # short-lived: limits damage if a token leaks
    cookie_secure: bool = True           # false only for local http development
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    allowed_origins: list[str] = ["http://localhost:5173"]
    # Clinical thresholds live in config, not code. VERIFY against current Uganda MoH guidelines.
    vl_failure_threshold: int = 1000     # copies/mL

settings = Settings()
