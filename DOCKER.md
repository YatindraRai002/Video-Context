# Docker Deployment Guide - ClipCompass

## Overview

This guide covers deploying ClipCompass using Docker and Docker Compose. The application consists of 5 containerized services:

1. **Backend** - FastAPI application (port 8000)
2. **Frontend** - Next.js application (port 3000)
3. **Celery Worker** - Background video processing
4. **Qdrant** - Vector database (ports 6333, 6334)
5. **Redis** - Task queue and cache (port 6379)

---

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- 10GB free disk space (for ML models and video data)

### Installation

**Windows:**
- Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

**macOS:**
- Install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## Quick Start

### 1. Clone and Setup

```bash
cd ClipCompass

# Copy environment file
cp .env.example .env

# (Optional) Edit .env to customize settings
nano .env
```

### 2. Build and Start Services

```bash
# Build all images (first time only, takes 5-10 minutes)
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

### 4. Verify Services

```bash
# Check service status
docker-compose ps

# All services should show "healthy" or "running"
```

Expected output:
```
NAME                        STATUS
clipcompass-backend         Up (healthy)
clipcompass-celery-worker   Up
clipcompass-frontend        Up (healthy)
clipcompass-qdrant          Up (healthy)
clipcompass-redis           Up (healthy)
```

---

## Service Architecture

```mermaid
graph TB
    User[User Browser] -->|Port 3000| Frontend[Frontend Container]
    Frontend -->|API Calls| Backend[Backend Container]
    Backend -->|Store Embeddings| Qdrant[Qdrant Container]
    Backend -->|Queue Tasks| Redis[Redis Container]
    Redis -->|Process Tasks| Worker[Celery Worker Container]
    Worker -->|Store Results| Qdrant
    Worker -->|Update Status| Backend
    
    subgraph "Docker Network: clipcompass-network"
        Frontend
        Backend
        Worker
        Qdrant
        Redis
    end
    
    subgraph "Persistent Volumes"
        Data[./data - Videos/Frames/Audio]
        DB[./backend/clipcompass.db - SQLite]
        QdrantVol[qdrant_storage - Vector DB]
    end
    
    Backend -.->|Mount| Data
    Backend -.->|Mount| DB
    Worker -.->|Mount| Data
    Worker -.->|Mount| DB
    Qdrant -.->|Mount| QdrantVol
```

---

## Configuration

### Environment Variables

Edit `.env` file to customize:

```bash
# AI Model Selection
WHISPER_MODEL=small          # Options: tiny, base, small, medium, large
CLIP_MODEL=ViT-B/32          # Vision model
TEXT_EMBEDDING_MODEL=all-MiniLM-L6-v2

# Processing Settings
FRAME_EXTRACTION_FPS=1.0     # Frames per second to extract
MAX_VIDEO_DURATION_MINUTES=60

# Database
DATABASE_URL=sqlite:///./clipcompass.db

# Service URLs (for Docker network)
QDRANT_HOST=qdrant
QDRANT_PORT=6333
REDIS_URL=redis://redis:6379/0
```

### Model Selection Guide

| Model Size | RAM Required | Speed | Accuracy |
|------------|--------------|-------|----------|
| tiny       | 1GB          | Fast  | Basic    |
| base       | 1.5GB        | Fast  | Good     |
| small      | 2GB          | Medium| Better   |
| medium     | 5GB          | Slow  | Great    |
| large      | 10GB         | Very Slow | Best |

**Recommendation**: Use `small` for development, `medium` for production.

---

## Volume Management

### Data Persistence

ClipCompass uses three volume mounts:

1. **`./data`** - Uploaded videos, extracted frames, and audio
2. **`./backend/clipcompass.db`** - SQLite database
3. **`qdrant_storage`** - Vector embeddings (Docker volume)

### Backup Data

```bash
# Backup everything
tar -czf clipcompass-backup-$(date +%Y%m%d).tar.gz data/ backend/clipcompass.db

# Backup Qdrant volume
docker run --rm -v clipcompass_qdrant_storage:/data -v $(pwd):/backup alpine tar -czf /backup/qdrant-backup.tar.gz -C /data .
```

### Restore Data

```bash
# Restore files
tar -xzf clipcompass-backup-20260201.tar.gz

# Restore Qdrant
docker run --rm -v clipcompass_qdrant_storage:/data -v $(pwd):/backup alpine tar -xzf /backup/qdrant-backup.tar.gz -C /data
```

### Clean Up Data

```bash
# Remove all uploaded videos and processed data
rm -rf data/videos/* data/frames/* data/audio/*

# Reset database
rm backend/clipcompass.db

# Restart services to reinitialize
docker-compose restart backend
```

---

## Scaling

### Scale Celery Workers

Process multiple videos in parallel:

```bash
# Scale to 3 workers
docker-compose up -d --scale celery-worker=3

# Check worker status
docker-compose logs celery-worker
```

**Note**: Each worker requires ~2GB RAM. Monitor system resources.

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          memory: 2G
```

---

## Development Mode

### Hot Reload with Volume Mounts

For development, mount source code:

```yaml
# docker-compose.dev.yml
services:
  backend:
    volumes:
      - ./backend:/app
      - ./data:/app/data
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Monitor Resource Usage

```bash
# Real-time stats
docker stats

# Service-specific
docker stats clipcompass-backend
```

### Health Checks

```bash
# Check all health statuses
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:6333/health
```

---

## Troubleshooting

### Services Won't Start

**Issue**: `ERROR: Service 'backend' failed to build`

**Solution**:
```bash
# Clean build cache
docker-compose build --no-cache

# Remove old containers
docker-compose down -v
docker-compose up -d
```

### Backend Shows "Unhealthy"

**Issue**: Health check failing

**Solution**:
```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. ML models still downloading (wait 2-3 minutes)
# 2. Qdrant not ready (check qdrant logs)
# 3. Port conflict (check if 8000 is in use)
```

### Celery Worker Not Processing

**Issue**: Videos stuck in "PENDING" status

**Solution**:
```bash
# Check worker logs
docker-compose logs celery-worker

# Restart worker
docker-compose restart celery-worker

# Verify Redis connection
docker-compose exec redis redis-cli ping
```

### Out of Memory

**Issue**: `Killed` in logs or services crashing

**Solution**:
```bash
# Check memory usage
docker stats

# Reduce Whisper model size in .env
WHISPER_MODEL=tiny

# Reduce worker concurrency
docker-compose up -d --scale celery-worker=1
```

### Port Already in Use

**Issue**: `bind: address already in use`

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000

# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Frontend Can't Connect to Backend

**Issue**: API calls failing from browser

**Solution**:
```bash
# Check NEXT_PUBLIC_API_URL in .env
# For Docker, use host machine IP, not 'localhost'

# Windows/Mac (Docker Desktop)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Linux
NEXT_PUBLIC_API_URL=http://172.17.0.1:8000

# Rebuild frontend
docker-compose up -d --build frontend
```

---

## Production Deployment

### Security Hardening

1. **Use External Databases**
```yaml
environment:
  - DATABASE_URL=postgresql://user:pass@db-host:5432/clipcompass
```

2. **Configure CORS**
Edit `backend/app/main.py`:
```python
allow_origins=["https://yourdomain.com"]
```

3. **Use Secrets**
```bash
# Don't commit .env
echo ".env" >> .gitignore

# Use Docker secrets
docker secret create db_password ./db_password.txt
```

4. **Enable HTTPS**
Use Nginx reverse proxy:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### GPU Support

For faster processing, enable GPU:

```yaml
services:
  backend:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

Update `backend/Dockerfile`:
```dockerfile
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04
# ... rest of Dockerfile
```

### Managed Services

For production, consider:
- **Qdrant Cloud** instead of self-hosted
- **AWS ElastiCache** instead of Redis container
- **RDS/Cloud SQL** instead of SQLite
- **S3/Cloud Storage** for video files

---

## Maintenance

### Update Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove unused images
docker image prune -a

# Full cleanup
docker system prune -a --volumes
```

---

## Performance Optimization

### Image Size Reduction

Current sizes:
- Backend: ~2.5GB (includes ML models)
- Frontend: ~150MB
- Total: ~3GB

Optimizations applied:
- Multi-stage builds
- Alpine base images (frontend)
- Slim Python image (backend)
- .dockerignore files

### Startup Time

- **Cold start**: 2-3 minutes (ML model downloads)
- **Hot start**: 30-45 seconds
- **Health check ready**: 60-90 seconds

### Processing Speed

Same as non-Docker deployment:
- 5-minute video: ~3 minutes (CPU)
- 5-minute video: ~1 minute (GPU)

---

## FAQ

**Q: Can I run this on Windows/Mac?**  
A: Yes, Docker Desktop supports both platforms.

**Q: How much disk space do I need?**  
A: Minimum 10GB (5GB for images, 5GB for data).

**Q: Can I use GPU acceleration?**  
A: Yes, see "GPU Support" section above.

**Q: How do I update to the latest version?**  
A: `git pull && docker-compose build && docker-compose up -d`

**Q: Can I deploy to cloud (AWS/GCP/Azure)?**  
A: Yes, use container services like ECS, Cloud Run, or AKS.

**Q: Is this production-ready?**  
A: For small-scale yes. For enterprise, see "Production Deployment" section.

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review troubleshooting section above
3. Check GitHub issues
4. Ensure Docker and Docker Compose are up to date

---

**Built with Docker for easy deployment and scaling** 🐳
