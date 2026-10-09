"""
DemandX 2.0 — Voice Processing & Speech Provider Abstraction
============================================================
Provides server-side speech abstraction, language code mapping,
and fallback synthesis/transcription support for Telugu, Hindi, and English.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel


class TranscribeRequest(BaseModel):
    language: str = "en"
    audio_base64: Optional[str] = None
    fallback_text: Optional[str] = None


class TranscribeResponse(BaseModel):
    success: bool
    text: str
    detected_language: str
    confidence: float = 0.95


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en"  # en, te, hi
    voice_gender: str = "neutral"


class SynthesizeResponse(BaseModel):
    success: bool
    text: str
    language: str
    speech_rate: float
    pitch: float
    recommended_web_speech_voice: str


SUPPORTED_VOICE_CONFIGS = {
    "te": {
        "lang_code": "te-IN",
        "name": "Telugu (India)",
        "rate": 0.95,
        "pitch": 1.0,
        "sample_greeting": "శుభ సాయంత్రం! DemandX AI కి స్వాగతం."
    },
    "hi": {
        "lang_code": "hi-IN",
        "name": "Hindi (India)",
        "rate": 0.95,
        "pitch": 1.0,
        "sample_greeting": "शुभ संध्या! DemandX AI में आपका स्वागत है।"
    },
    "en": {
        "lang_code": "en-IN",
        "name": "English (India)",
        "rate": 1.0,
        "pitch": 1.0,
        "sample_greeting": "Good evening! Welcome to DemandX AI."
    }
}


def get_voice_parameters(language: str) -> SynthesizeResponse:
    cfg = SUPPORTED_VOICE_CONFIGS.get(language, SUPPORTED_VOICE_CONFIGS["en"])
    return SynthesizeResponse(
        success=True,
        text=cfg["sample_greeting"],
        language=language,
        speech_rate=cfg["rate"],
        pitch=cfg["pitch"],
        recommended_web_speech_voice=cfg["lang_code"]
    )
