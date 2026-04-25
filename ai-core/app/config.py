"""
Environment config for the AI Core microservice.
"""
from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_fast_model: str = "gpt-4o-mini"

    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    elevenlabs_model_id: str = "eleven_turbo_v2_5"

    # Mock flags (demo without API keys)
    mock_llm: bool = False
    mock_tts: bool = False
    mock_stt: bool = False

    # App
    backend_port: int = 8001
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def is_mock_mode(self) -> bool:
        return self.mock_llm or not self.openai_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
