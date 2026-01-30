"""
Transcription service using OpenAI Whisper.
Provides timestamped speech-to-text conversion.
"""

from pathlib import Path
from typing import List
import whisper
import torch

from app.config import settings


class TranscriptionSegment:
    """Represents a segment of transcribed text with timestamps."""
    
    def __init__(self, text: str, start: float, end: float, words: List[dict] = None):
        self.text = text
        self.start = start
        self.end = end
        self.words = words or []


class Transcriber:
    """Handles audio transcription using Whisper."""
    
    def __init__(self, model_name: str = None):
        """
        Initialize Whisper model.
        
        Args:
            model_name: Whisper model size (tiny, base, small, medium, large)
        """
        self.model_name = model_name or settings.whisper_model
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def _load_model(self):
        """Lazy load the Whisper model."""
        if self.model is None:
            print(f"Loading Whisper model '{self.model_name}' on {self.device}...")
            self.model = whisper.load_model(self.model_name, device=self.device)
            print("Whisper model loaded!")
    
    async def transcribe(self, audio_path: Path, language: str = None) -> List[TranscriptionSegment]:
        """
        Transcribe audio file with timestamps.
        
        Args:
            audio_path: Path to audio file
            language: Optional language code (auto-detect if None)
            
        Returns:
            List of TranscriptionSegment objects with timestamps
        """
        self._load_model()
        
        # Transcribe with word-level timestamps
        result = self.model.transcribe(
            str(audio_path),
            language=language,
            word_timestamps=True,
            verbose=False
        )
        
        segments = []
        for seg in result.get("segments", []):
            segment = TranscriptionSegment(
                text=seg["text"].strip(),
                start=seg["start"],
                end=seg["end"],
                words=seg.get("words", [])
            )
            segments.append(segment)
        
        return segments
    
    def chunk_segments(
        self,
        segments: List[TranscriptionSegment],
        chunk_duration: float = None
    ) -> List[TranscriptionSegment]:
        """
        Combine segments into larger chunks for embedding.
        
        Args:
            segments: Original transcription segments
            chunk_duration: Target duration per chunk in seconds
            
        Returns:
            List of combined segments
        """
        chunk_duration = chunk_duration or settings.transcript_chunk_size
        
        if not segments:
            return []
        
        chunks = []
        current_texts = []
        current_start = segments[0].start
        current_end = segments[0].start
        
        for seg in segments:
            if seg.start - current_start >= chunk_duration and current_texts:
                # Create chunk
                chunks.append(TranscriptionSegment(
                    text=" ".join(current_texts),
                    start=current_start,
                    end=current_end
                ))
                current_texts = []
                current_start = seg.start
            
            current_texts.append(seg.text)
            current_end = seg.end
        
        # Add remaining text
        if current_texts:
            chunks.append(TranscriptionSegment(
                text=" ".join(current_texts),
                start=current_start,
                end=current_end
            ))
        
        return chunks
