"""
Celery tasks for video processing.
"""

from app.workers.celery_app import celery_app
from app.workers.pipeline import process_video_task as _process_video_task


@celery_app.task(name='process_video', bind=True)
def process_video_task(self, video_id: str):
    """
    Celery task wrapper for video processing.
    
    Args:
        video_id: ID of the video to process
    """
    import asyncio
    
    # Run the async processing function
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # If event loop is already running, create a new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(_process_video_task(video_id))
    finally:
        if not loop.is_running():
            loop.close()
