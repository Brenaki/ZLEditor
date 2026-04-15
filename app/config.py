from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8765
    debug: bool = False

    class Config:
        env_prefix = "ZLE_"


settings = Settings()
