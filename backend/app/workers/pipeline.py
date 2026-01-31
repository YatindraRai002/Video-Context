"""
Video processing pipeline.
Background task wrapper for processing uploaded videos.
"""

from app.core.database import SessionLocal
from app.models.video import Video, VideoStatus
from app.services.video_processor import video_processor


async def process_video_task(video_id: str):
    """
    Background task wrapper for video processing.
    Delegates to video_processor service.
    """
    db = SessionLocal()
    try:
        # Get video from database
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            print(f"[ERROR] Video {video_id} not found")
            return
        
        # Run processing pipeline
        await video_processor.process_video(db, video)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Processing failed for {video_id}: {str(e)}")
        # Update status to FAILED if not already done by processor
        # (Though processor should ideally handle its own errors, we catch top-level here)
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if video:
                video.status = VideoStatus.FAILED.value
                video.error_message = str(e)
                db.commit()
        except:
            pass
            
    finally:
        db.close()
