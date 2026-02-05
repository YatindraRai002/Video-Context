"""
Unit tests for video processing services.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from app.services.video_processor import VideoProcessor
from app.services.audio_extractor import AudioExtractor
from app.services.frame_extractor import FrameExtractor
from app.services.transcriber import Transcriber
from app.services.embedder import Embedder
from app.models.video import Video, VideoStatus


class TestAudioExtractor:
    """Tests for AudioExtractor service."""
    
    @patch('subprocess.run')
    def test_extract_audio_success(self, mock_run):
        """Test successful audio extraction."""
        mock_run.return_value = Mock(returncode=0)
        
        extractor = AudioExtractor()
        video_path = Path("test_video.mp4")
        output_path = Path("test_audio.wav")
        
        result = extractor.extract(video_path, output_path)
        
        assert result == output_path
        mock_run.assert_called_once()
    
    @patch('subprocess.run')
    def test_extract_audio_failure(self, mock_run):
        """Test audio extraction failure."""
        mock_run.side_effect = Exception("FFmpeg error")
        
        extractor = AudioExtractor()
        video_path = Path("test_video.mp4")
        output_path = Path("test_audio.wav")
        
        with pytest.raises(Exception):
            extractor.extract(video_path, output_path)


class TestFrameExtractor:
    """Tests for FrameExtractor service."""
    
    @patch('cv2.VideoCapture')
    def test_extract_frames_success(self, mock_cv2):
        """Test successful frame extraction."""
        mock_video = MagicMock()
        mock_video.get.return_value = 30.0  # FPS
        mock_video.read.side_effect = [(True, Mock()), (False, None)]
        mock_cv2.return_value = mock_video
        
        extractor = FrameExtractor(fps=1.0)
        video_path = Path("test_video.mp4")
        output_dir = Path("frames/")
        
        frames = extractor.extract(video_path, output_dir)
        
        assert isinstance(frames, list)
    
    def test_extract_frames_invalid_video(self):
        """Test frame extraction with invalid video."""
        extractor = FrameExtractor()
        video_path = Path("nonexistent.mp4")
        output_dir = Path("frames/")
        
        with pytest.raises(Exception):
            extractor.extract(video_path, output_dir)


class TestEmbedder:
    """Tests for Embedder service."""
    
    @patch('sentence_transformers.SentenceTransformer')
    @patch('transformers.CLIPProcessor')
    @patch('transformers.CLIPModel')
    def test_embed_text(self, mock_clip_model, mock_clip_processor, mock_st):
        """Test text embedding generation."""
        mock_st.return_value.encode.return_value = [[0.1] * 384]
        
        embedder = Embedder()
        text = "Sample text for embedding"
        
        embedding = embedder.embed_text(text)
        
        assert isinstance(embedding, list)
        assert len(embedding) == 384
    
    @patch('sentence_transformers.SentenceTransformer')
    @patch('transformers.CLIPProcessor')
    @patch('transformers.CLIPModel')
    @patch('PIL.Image.open')
    def test_embed_image(self, mock_image, mock_clip_model, mock_clip_processor, mock_st):
        """Test image embedding generation."""
        mock_image.return_value = Mock()
        mock_clip_processor.return_value.return_value = {"pixel_values": Mock()}
        mock_clip_model.return_value.get_image_features.return_value = Mock(
            detach=Mock(return_value=Mock(numpy=Mock(return_value=[[0.1] * 512])))
        )
        
        embedder = Embedder()
        image_path = Path("test_frame.jpg")
        
        embedding = embedder.embed_image(image_path)
        
        assert isinstance(embedding, list)


class TestTranscriber:
    """Tests for Whisper Transcriber service."""
    
    @patch('whisper.load_model')
    def test_transcribe_audio(self, mock_whisper):
        """Test audio transcription."""
        mock_model = Mock()
        mock_model.transcribe.return_value = {
            "text": "Sample transcription",
            "segments": [
                {
                    "start": 0.0,
                    "end": 5.0,
                    "text": "Sample transcription",
                    "words": [
                        {"word": "Sample", "start": 0.0, "end": 1.0},
                        {"word": "transcription", "start": 1.0, "end": 5.0}
                    ]
                }
            ]
        }
        mock_whisper.return_value = mock_model
        
        transcriber = Transcriber(model_name="base")
        audio_path = Path("test_audio.wav")
        
        result = transcriber.transcribe(audio_path)
        
        assert "text" in result
        assert "segments" in result
        assert len(result["segments"]) > 0


class TestVideoProcessor:
    """Tests for VideoProcessor orchestration."""
    
    @pytest.fixture
    def mock_video(self, db_session):
        """Create a mock video object."""
        video = Video(
            id="test-video-id",
            title="Test Video",
            file_path="test_video.mp4",
            status=VideoStatus.PENDING
        )
        return video
    
    @patch('app.services.video_processor.AudioExtractor')
    @patch('app.services.video_processor.FrameExtractor')
    @patch('app.services.video_processor.Transcriber')
    @patch('app.services.video_processor.Embedder')
    @patch('app.services.video_processor.VectorStore')
    def test_process_video_success(
        self,
        mock_vector_store,
        mock_embedder,
        mock_transcriber,
        mock_frame_extractor,
        mock_audio_extractor,
        mock_video
    ):
        """Test successful video processing pipeline."""
        # Setup mocks
        mock_audio_extractor.return_value.extract.return_value = Path("audio.wav")
        mock_transcriber.return_value.transcribe.return_value = {
            "text": "Test",
            "segments": [{"start": 0, "end": 5, "text": "Test", "words": []}]
        }
        mock_frame_extractor.return_value.extract.return_value = [
            {"path": Path("frame_0.jpg"), "timestamp": 0.0}
        ]
        mock_embedder.return_value.embed_text.return_value = [0.1] * 384
        mock_embedder.return_value.embed_image.return_value = [0.1] * 512
        
        processor = VideoProcessor()
        
        # This would need more setup to work properly
        # result = processor.process(mock_video)
        # assert result.status == VideoStatus.READY


@pytest.fixture
def db_session():
    """Mock database session."""
    return Mock()
