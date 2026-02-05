"""
Search API routes.
Implements semantic search across transcripts and video frames.
"""

from fastapi import APIRouter, Depends, Query
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Optional
import time

from app.core.database import get_db
from app.config import settings
from app.models.video import Video
from app.models.schemas import SearchRequest, SearchResponse, SearchResultItem
from app.services.embedder import Embedder
from app.services.vector_store import VectorStore

router = APIRouter()

# Initialize services
embedder = Embedder()
vector_store = VectorStore()


@router.get("/", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    video_id: Optional[str] = Query(None, description="Filter by specific video"),
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    search_type: str = Query("hybrid", description="transcript, frames, or hybrid"),
    db: Session = Depends(get_db)
):
    """
    Search across video transcripts and frames.
    
    - **q**: Natural language search query (e.g., "when did they discuss the budget")
    - **video_id**: Optional filter to search within a specific video
    - **limit**: Maximum number of results to return
    - **search_type**: 
        - `transcript`: Search only in transcripts
        - `frames`: Search only in frame captions/embeddings  
        - `hybrid`: Search both and merge results (default)
    """
    start_time = time.time()
    results = []
    
    try:
        # Search transcripts
        if search_type in ["transcript", "hybrid"]:
            text_embedding = await embedder.embed_text([q])
            transcript_results = await vector_store.search_transcripts(
                text_embedding[0], video_id, limit
            )
            
            for r in transcript_results:
                # Get video title
                video = db.query(Video).filter(Video.id == r["video_id"]).first()
                video_title = video.title if video else "Unknown"
                
                results.append(SearchResultItem(
                    video_id=r["video_id"],
                    video_title=video_title,
                    timestamp=r.get("start_time", 0),
                    end_time=r.get("end_time"),
                    transcript_snippet=r.get("text"),
                    frame_path=None,
                    frame_caption=None,
                    score=r["score"],
                    match_type="transcript"
                ))
        
        # Search frames
        if search_type in ["frames", "hybrid"]:
            clip_embedding = await embedder.embed_text_clip([q])
            frame_results = await vector_store.search_frames(
                clip_embedding[0], video_id, limit
            )
            
            for r in frame_results:
                video = db.query(Video).filter(Video.id == r["video_id"]).first()
                video_title = video.title if video else "Unknown"
                # Convert full path to URL path (relative to frames_dir) for frontend
                frame_path_raw = r.get("frame_path")
                frame_path_url = None
                if frame_path_raw:
                    try:
                        fp = Path(frame_path_raw)
                        rel = fp.relative_to(settings.frames_dir)
                        frame_path_url = str(rel).replace("\\", "/")
                    except (ValueError, TypeError):
                        frame_path_url = Path(frame_path_raw).name
                
                results.append(SearchResultItem(
                    video_id=r["video_id"],
                    video_title=video_title,
                    timestamp=r.get("timestamp", 0),
                    end_time=None,
                    transcript_snippet=None,
                    frame_path=frame_path_url,
                    frame_caption=r.get("caption"),
                    score=r["score"],
                    match_type="frame"
                ))
        
        # Sort by score and limit
        results.sort(key=lambda x: x.score, reverse=True)
        results = results[:limit]
        
    except Exception as e:
        print(f"Search error: {e}")
        # Return empty results on error
        results = []
    
    latency_ms = (time.time() - start_time) * 1000
    
    return SearchResponse(
        query=q,
        results=results,
        total_results=len(results),
        latency_ms=latency_ms
    )


@router.post("/", response_model=SearchResponse)
async def search_post(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Alternative POST-based search endpoint.
    Supports more complex search requests with filters.
    """
    start_time = time.time()
    results = []
    
    try:
        search_type = request.search_type or "hybrid"
        limit = request.limit or 10
        video_id = request.video_id
        
        # Search transcripts
        if search_type in ["transcript", "hybrid"]:
            text_embedding = await embedder.embed_text([request.query])
            transcript_results = await vector_store.search_transcripts(
                text_embedding[0], video_id, limit
            )
            
            for r in transcript_results:
                video = db.query(Video).filter(Video.id == r["video_id"]).first()
                video_title = video.title if video else "Unknown"
                
                results.append(SearchResultItem(
                    video_id=r["video_id"],
                    video_title=video_title,
                    timestamp=r.get("start_time", 0),
                    end_time=r.get("end_time"),
                    transcript_snippet=r.get("text"),
                    frame_path=None,
                    frame_caption=None,
                    score=r["score"],
                    match_type="transcript"
                ))
        
        # Search frames
        if search_type in ["frames", "hybrid"]:
            clip_embedding = await embedder.embed_text_clip([request.query])
            frame_results = await vector_store.search_frames(
                clip_embedding[0], video_id, limit
            )
            
            for r in frame_results:
                video = db.query(Video).filter(Video.id == r["video_id"]).first()
                video_title = video.title if video else "Unknown"
                
                frame_path_raw = r.get("frame_path")
                frame_path_url = None
                if frame_path_raw:
                    try:
                        fp = Path(frame_path_raw)
                        rel = fp.relative_to(settings.frames_dir)
                        frame_path_url = str(rel).replace("\\", "/")
                    except (ValueError, TypeError):
                        frame_path_url = Path(frame_path_raw).name
                
                results.append(SearchResultItem(
                    video_id=r["video_id"],
                    video_title=video_title,
                    timestamp=r.get("timestamp", 0),
                    end_time=None,
                    transcript_snippet=None,
                    frame_path=frame_path_url,
                    frame_caption=r.get("caption"),
                    score=r["score"],
                    match_type="frame"
                ))
        
        # Sort by score and limit
        results.sort(key=lambda x: x.score, reverse=True)
        results = results[:limit]
        
    except Exception as e:
        print(f"Search error: {e}")
        results = []
    
    latency_ms = (time.time() - start_time) * 1000
    
    return SearchResponse(
        query=request.query,
        results=results,
        total_results=len(results),
        latency_ms=latency_ms
    )


@router.get("/status")
async def search_status(db: Session = Depends(get_db)):
    """
    Diagnostic: Qdrant connection, embedding counts, and video statuses.
    Use this to see why search might return no results.
    """
    qdrant_connected = vector_store.is_connected
    transcript_count = vector_store.get_collection_count(vector_store.transcript_collection) if qdrant_connected else 0
    frame_count = vector_store.get_collection_count(vector_store.frame_collection) if qdrant_connected else 0
    videos = db.query(Video).order_by(Video.created_at.desc()).limit(50).all()
    video_statuses = [
        {"id": v.id, "title": v.title, "status": v.status, "processing_progress": v.processing_progress}
        for v in videos
    ]
    return {
        "qdrant_connected": qdrant_connected,
        "transcript_embeddings": transcript_count,
        "frame_embeddings": frame_count,
        "videos": video_statuses,
        "hint": "Search returns results only when videos have status 'ready' and Qdrant is running (docker-compose up -d)."
    }


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """
    Get search suggestions based on query prefix.
    Returns common phrases from transcript segments.
    """
    query_lower = q.lower()
    suggestions = []
    
    try:
        # Get recent transcript segments that contain the query
        from app.models.video import TranscriptSegment
        
        segments = db.query(TranscriptSegment).filter(
            TranscriptSegment.text.ilike(f"%{q}%")
        ).limit(limit * 3).all()
        
        # Extract unique phrases containing the query
        seen = set()
        for seg in segments:
            text = seg.text.strip()
            # Only suggest if text contains the query and isn't too long
            if query_lower in text.lower() and len(text) < 100 and text not in seen:
                suggestions.append(text)
                seen.add(text)
                if len(suggestions) >= limit:
                    break
        
    except Exception as e:
        print(f"Suggestions error: {e}")
    
    return {"suggestions": suggestions[:limit]}
