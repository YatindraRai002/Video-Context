"""
Clip generation API routes.
Allows users to extract and download video segments.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import uuid
from pathlib import Path

from app.core.database import get_db
from app.models.schemas import ClipRequest, ClipResponse
from app.models.video import Video, VideoStatus, TranscriptSegment
from app.services.clip_generator import clip_generator

router = APIRouter()


@router.post("/generate", response_model=ClipResponse)
async def generate_clip(
    request: ClipRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a video clip from a specific timestamp range.
    
    - **video_id**: ID of the source video
    - **start_time**: Start timestamp in seconds
    - **end_time**: End timestamp in seconds
    - **include_captions**: Whether to burn captions into the clip
    """
    # Validate video exists
    video = db.query(Video).filter(Video.id == request.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.status != VideoStatus.READY.value:
        raise HTTPException(status_code=400, detail="Video is not fully processed")
    
    # Validate timestamps
    if request.start_time < 0:
        raise HTTPException(status_code=400, detail="Start time must be positive")
    
    if request.end_time <= request.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    if video.duration_seconds and request.end_time > video.duration_seconds:
        raise HTTPException(status_code=400, detail="End time exceeds video duration")
    
    try:
        clip_id = str(uuid.uuid4())
        
        if request.include_captions:
            # Get transcript segments for this time range
            segments = db.query(TranscriptSegment).filter(
                TranscriptSegment.video_id == request.video_id,
                TranscriptSegment.start_time >= request.start_time,
                TranscriptSegment.end_time <= request.end_time
            ).all()
            
            captions = [
                {"text": seg.text, "start": seg.start_time, "end": seg.end_time}
                for seg in segments
            ]
            
            clip_path = await clip_generator.generate_clip_with_captions(
                video.file_path,
                request.start_time,
                request.end_time,
                captions,
                clip_id
            )
        else:
            clip_path = await clip_generator.generate_clip(
                video.file_path,
                request.start_time,
                request.end_time,
                clip_id
            )
        
        return ClipResponse(
            clip_id=clip_id,
            video_id=request.video_id,
            start_time=request.start_time,
            end_time=request.end_time,
            file_path=str(clip_path),
            duration=request.end_time - request.start_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate clip: {str(e)}")


@router.get("/{clip_id}")
async def get_clip(clip_id: str):
    """Get information about a generated clip."""
    if not clip_generator.clip_exists(clip_id):
        raise HTTPException(status_code=404, detail="Clip not found")
    
    clip_path = clip_generator.get_clip_path(clip_id)
    
    return {
        "clip_id": clip_id,
        "file_path": str(clip_path),
        "exists": True
    }


@router.get("/{clip_id}/download")
async def download_clip(clip_id: str):
    """Download a generated clip."""
    if not clip_generator.clip_exists(clip_id):
        raise HTTPException(status_code=404, detail="Clip not found")
    
    clip_path = clip_generator.get_clip_path(clip_id)
    
    return FileResponse(
        str(clip_path),
        media_type="video/mp4",
        filename=f"clip_{clip_id}.mp4"
    )
