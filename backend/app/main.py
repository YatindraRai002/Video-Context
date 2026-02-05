"""
ClipCompass - Video-Context Search Engine
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pathlib import Path

from app.config import settings
from app.core.database import init_db
from app.core.logger import get_logger
from app.core.exceptions import ClipCompassException
from app.api.routes import videos, search, clips, asr

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    logger.info("Starting ClipCompass...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    # Create data directories
    for directory in [settings.upload_dir, settings.frames_dir, settings.audio_dir]:
        Path(directory).mkdir(parents=True, exist_ok=True)
    logger.info("Data directories ready")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ClipCompass...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-modal video search engine with AI-powered transcript and frame analysis.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving frames
app.mount("/static/frames", StaticFiles(directory=str(settings.frames_dir)), name="frames")
app.mount("/static/videos", StaticFiles(directory=str(settings.upload_dir)), name="videos")

# Include API routes
app.include_router(videos.router, prefix=f"{settings.api_prefix}/videos", tags=["Videos"])
app.include_router(search.router, prefix=f"{settings.api_prefix}/search", tags=["Search"])
app.include_router(clips.router, prefix=f"{settings.api_prefix}/clips", tags=["Clips"])
app.include_router(asr.router, prefix=f"{settings.api_prefix}/asr", tags=["ASR (Speech-to-Text)"])


# Exception handlers
@app.exception_handler(ClipCompassException)
async def clipcompass_exception_handler(request: Request, exc: ClipCompassException):
    """Handle custom application exceptions."""
    logger.error(f"Application error: {exc.message}", extra={"details": exc.details})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors."""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "details": str(exc) if settings.debug else "Contact support for assistance"
        }
    )


@app.get("/")
async def root():
    """Root endpoint."""
    logger.debug("Root endpoint accessed")
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}
