"""
Custom exception classes for ClipCompass application.
"""


class ClipCompassException(Exception):
    """Base exception for all ClipCompass errors."""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class VideoProcessingError(ClipCompassException):
    """Raised when video processing fails."""
    pass


class AudioExtractionError(ClipCompassException):
    """Raised when audio extraction fails."""
    pass


class TranscriptionError(ClipCompassException):
    """Raised when transcription fails."""
    pass


class FrameExtractionError(ClipCompassException):
    """Raised when frame extraction fails."""
    pass


class EmbeddingError(ClipCompassException):
    """Raised when embedding generation fails."""
    pass


class VectorStoreError(ClipCompassException):
    """Raised when vector database operations fail."""
    pass


class VideoNotFoundError(ClipCompassException):
    """Raised when a requested video doesn't exist."""
    pass


class InvalidVideoFormatError(ClipCompassException):
    """Raised when video format is not supported."""
    pass


class VideoDownloadError(ClipCompassException):
    """Raised when YouTube/URL video download fails."""
    pass


class SearchError(ClipCompassException):
    """Raised when search operation fails."""
    pass


class DatabaseError(ClipCompassException):
    """Raised when database operation fails."""
    pass
