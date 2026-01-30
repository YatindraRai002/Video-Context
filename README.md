# ClipCompass 
### Multi-Modal Video-Context Search Engine

ClipCompass is a production-ready **Multi-Modal RAG system** that ingests videos (Zoom recordings, YouTube content), synchronizes audio transcripts with visual frame embeddings, and enables natural language search across both modalities.

**Why This Matters:** Text RAG is a solved problem. The real challenge is handling **unstructured multi-modal data**—this project proves you can build complex pipelines that synchronize audio and visual information at scale.

---

##  Project Vision

**The Problem:** Companies have massive amounts of video data (Zoom calls, training recordings, customer demos) that's impossible to search effectively.

**The Solution:** A search engine that understands both what was *said* and what was *shown* in videos, enabling queries like:
- *"Show me when the CEO discussed the budget"* (audio search)
- *"Find slides with revenue charts"* (visual search)  
- *"When did they present the product demo?"* (hybrid search)

---

## 🚀 Features

### Core Capabilities
-   **Multi-Modal Search**: Hybrid search combining audio transcripts (Whisper) and visual content (CLIP)
-   **Timestamp Synchronization**: Frame embeddings aligned with transcript segments for accurate results
-   **Natural Language Queries**: Search using conversational language, not keywords
-   **Smart Playback**: Click results to jump to exact video moments
-   **Auto-Tagging**: Visual scenes tagged with ResNet50 for enhanced discoverability

### Technical Highlights
-   **Whisper ASR**: Word-level timestamped transcription
-   **CLIP Vision**: Image-text similarity for visual search
-   **Qdrant Vector DB**: Efficient similarity search at scale
-   **Async Processing**: Background video processing pipeline
-   **YouTube Support**: Direct URL ingestion via yt-dlp

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (async Python)
- **AI/ML**: 
  - OpenAI Whisper (speech-to-text)
  - CLIP (visual embeddings)
  - ResNet50 (image classification)
  - Sentence-Transformers (text embeddings)
- **Vector Database**: Qdrant
- **Video Processing**: FFmpeg, yt-dlp
- **Task Queue**: Celery + Redis

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **UI**: Glassmorphism design, responsive layout

---

## 📦 Installation

### Prerequisites
-   Python 3.10+
-   Node.js 18+
-   Docker & Docker Compose (for Qdrant/Redis)
-   FFmpeg (auto-installed via static-ffmpeg)

### Quick Start

#### 1. Start Infrastructure Services
```bash
docker-compose up -d
```
This starts Qdrant (vector DB) and Redis (task queue).

#### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\\venv\\Scripts\\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
**Note:** First run downloads ML models (~1-2GB). Subsequent starts are instant.

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 4. Open Application
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🎮 Usage

### Upload & Process a Video
1. Click **Upload Video** or paste a YouTube URL
2. Wait for processing (transcription + frame extraction + embedding)
3. Processing stages:
   - Audio extraction
   - Whisper transcription (word-level timestamps)
   - Frame extraction (1 FPS)
   - Visual tagging (ResNet50)
   - Embedding generation (CLIP + Sentence-Transformers)
   - Vector storage (Qdrant)

### Search Your Videos
1. Enter a natural language query
2. Select search type:
   - **Transcript**: Search spoken content
   - **Frames**: Search visual content
   - **Hybrid**: Search both (recommended)
3. Click results to jump to exact timestamps

---

## 🏗️ Architecture

### Processing Pipeline
```
Video Input → Audio Extraction → Whisper Transcription
                ↓
         Frame Extraction → CLIP Embeddings → Qdrant
                ↓
         Transcript Chunks → Text Embeddings → Qdrant
                ↓
         Timestamp Sync → Hybrid Search Ready
```

### Multi-Modal Synchronization
The core innovation is **timestamp alignment**:
- Frames extracted at 1 FPS with precise timestamps
- Transcripts chunked into 10-second segments
- Search results merge audio + visual data within 5-second windows
- Enables queries like *"show the slide when they mentioned Q4 revenue"*

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for detailed technical documentation.

---

## 📊 Performance

- **Processing Speed**: ~3 minutes for 5-minute video (CPU)
- **Search Latency**: <500ms for hybrid queries
- **Frame Rate**: 1 frame/second (configurable)
- **Embedding Dimensions**: 
  - Text: 384 (all-MiniLM-L6-v2)
  - Images: 512 (CLIP ViT-B/32)

---

## 🔧 Configuration

Edit `backend/app/config.py` or use environment variables:

```bash
# AI Models
WHISPER_MODEL=base  # tiny, base, small, medium, large
CLIP_MODEL=ViT-B/32
TEXT_EMBEDDING_MODEL=all-MiniLM-L6-v2

# Processing
FRAME_EXTRACTION_FPS=1.0
TRANSCRIPT_CHUNK_SIZE=10  # seconds

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest app/tests/ -v

# Frontend build
cd frontend
npm run build
```

---

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Production Considerations
- Configure CORS origins in `main.py`
- Use GPU-enabled containers for faster processing
- Scale Celery workers for parallel video processing
- Use managed Qdrant Cloud for production vector storage

---

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints
- `POST /api/v1/videos/upload` - Upload video file
- `POST /api/v1/videos/youtube` - Process YouTube URL
- `GET /api/v1/search/` - Multi-modal search
- `GET /api/v1/videos/{id}` - Get video details

---

## 🎯 Why This Project Stands Out

### Engineering Complexity
1. **Multi-Modal Synchronization**: Aligning audio and visual data streams
2. **Async Pipeline**: Background processing with progress tracking
3. **Vector Search**: Efficient similarity search across millions of embeddings
4. **Real-World Application**: Solves actual enterprise problems (searchable meeting recordings)

### Beyond Text RAG
- Text RAG: Embed documents → Search → Retrieve chunks ✅ (Solved)
- **Video RAG**: Extract audio + frames → Sync timestamps → Hybrid search → Retrieve moments 🚀 (This project)

---

## 🤝 Contributing

This is a portfolio/research project. Feel free to fork and adapt for your use case!
---



---

## 🙏 Acknowledgments

Built with:
- [OpenAI Whisper](https://github.com/openai/whisper)
- [CLIP](https://github.com/openai/CLIP)
- [Qdrant](https://qdrant.tech/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)

---

**Built to demonstrate mastery of complex, unstructured data pipelines** 🎯
