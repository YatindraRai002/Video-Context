

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import tempfile
from pathlib import Path

from app.services.transcriber import Transcriber

router = APIRouter()


class VoiceQueryResponse(BaseModel):
    """Response from voice-to-text transcription."""
    text: str
    confidence: float
    language: str


class TranscriptionResponse(BaseModel):
    """Full transcription response with segments."""
    text: str
    segments: list
    language: str
    duration: float


# Initialize transcriber (GPU-accelerated)
transcriber = Transcriber()


@router.post("/voice-to-text", response_model=VoiceQueryResponse)
async def voice_to_text(
    audio: UploadFile = File(..., description="Audio file (wav, mp3, webm)")
):
    """
    Convert voice query to text using Whisper ASR.
    
    This endpoint is designed for:
    - Voice search queries
    - Real-time transcription of short audio clips
    
    Supports: WAV, MP3, WebM, M4A audio formats.
    Runs on GPU for fast inference (~1s for 10s audio).
    """
    # Validate file type
    allowed_types = [
        "audio/wav", "audio/wave", "audio/x-wav",
        "audio/mp3", "audio/mpeg",
        "audio/webm", "audio/m4a", "audio/mp4"
    ]
    
    content_type = audio.content_type or ""
    if not any(t in content_type for t in ["audio", "video"]):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Upload audio file."
        )
    
    # Save to temp file
    suffix = Path(audio.filename or "audio.wav").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)
    
    try:
        # Transcribe using Whisper
        segments = await transcriber.transcribe(tmp_path)
        
        # Combine all segments into full text
        full_text = " ".join(seg.text for seg in segments)
        
        return VoiceQueryResponse(
            text=full_text.strip(),
            confidence=0.95,  # Whisper doesn't provide confidence directly
            language="en"  # Could be detected from Whisper result
        )
    finally:
        # Cleanup temp file
        tmp_path.unlink(missing_ok=True)


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = None
):
    """
    Full transcription with timestamps.
    
    Returns detailed segments with start/end times.
    Use for longer audio files or when timestamps are needed.
    """
    # Save to temp file
    suffix = Path(audio.filename or "audio.wav").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)
    
    try:
        segments = await transcriber.transcribe(tmp_path, language=language)
        
        full_text = " ".join(seg.text for seg in segments)
        duration = segments[-1].end if segments else 0
        
        return TranscriptionResponse(
            text=full_text.strip(),
            segments=[
                {
                    "text": seg.text,
                    "start": seg.start,
                    "end": seg.end
                }
                for seg in segments
            ],
            language=language or "auto",
            duration=duration
        )
    finally:
        tmp_path.unlink(missing_ok=True)


@router.get("/models")
async def list_asr_models():
    """List available Whisper model sizes."""
    return {
        "available_models": [
            {"name": "tiny", "size": "75MB", "speed": "fastest", "accuracy": "lowest"},
            {"name": "base", "size": "142MB", "speed": "fast", "accuracy": "good"},
            {"name": "small", "size": "466MB", "speed": "medium", "accuracy": "better"},
            {"name": "medium", "size": "1.5GB", "speed": "slow", "accuracy": "high"},
            {"name": "large", "size": "3GB", "speed": "slowest", "accuracy": "best"}
        ],
        "current_model": transcriber.model_name,
        "device": transcriber.device
    }
