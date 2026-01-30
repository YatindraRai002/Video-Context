"""
Embedding service for text and images.
Uses CLIP for image embeddings and sentence-transformers for text.
"""

from pathlib import Path
from typing import List, Union
import torch
from PIL import Image
import numpy as np

from app.config import settings


class Embedder:
    """Generates embeddings for text and images."""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._clip_model = None
        self._clip_processor = None
        self._text_model = None
    
    def _load_clip(self):
        """Lazy load CLIP model."""
        if self._clip_model is None:
            from transformers import CLIPProcessor, CLIPModel
            
            print(f"Loading CLIP model '{settings.clip_model}'...")
            model_name = f"openai/clip-vit-base-patch32"
            self._clip_model = CLIPModel.from_pretrained(model_name).to(self.device)
            self._clip_processor = CLIPProcessor.from_pretrained(model_name)
            print("CLIP model loaded!")
    
    def _load_text_model(self):
        """Lazy load sentence-transformers model."""
        if self._text_model is None:
            from sentence_transformers import SentenceTransformer
            
            print(f"Loading text embedding model '{settings.text_embedding_model}'...")
            self._text_model = SentenceTransformer(
                settings.text_embedding_model,
                device=self.device
            )
            print("Text model loaded!")
    
    async def embed_text(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for text using sentence-transformers.
        
        Args:
            texts: List of text strings
            
        Returns:
            numpy array of shape (len(texts), embedding_dim)
        """
        self._load_text_model()
        
        embeddings = self._text_model.encode(
            texts,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        
        return embeddings
    
    async def embed_images(self, image_paths: List[Path]) -> np.ndarray:
        """
        Generate CLIP embeddings for images.
        
        Args:
            image_paths: List of paths to image files
            
        Returns:
            numpy array of shape (len(images), 512)
        """
        self._load_clip()
        
        images = [Image.open(p).convert("RGB") for p in image_paths]
        
        inputs = self._clip_processor(
            images=images,
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            image_features = self._clip_model.get_image_features(**inputs)
        
        # Normalize embeddings
        embeddings = image_features.cpu().numpy()
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        
        return embeddings
    
    async def embed_text_clip(self, texts: List[str]) -> np.ndarray:
        """
        Generate CLIP text embeddings (for image-text similarity).
        
        Args:
            texts: List of text strings
            
        Returns:
            numpy array of shape (len(texts), 512)
        """
        self._load_clip()
        
        inputs = self._clip_processor(
            text=texts,
            return_tensors="pt",
            padding=True,
            truncation=True
        ).to(self.device)
        
        with torch.no_grad():
            text_features = self._clip_model.get_text_features(**inputs)
        
        embeddings = text_features.cpu().numpy()
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        
        return embeddings
    
    async def generate_caption(self, image_path: Path) -> str:
        """
        Generate a text caption for an image using BLIP or similar.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Generated caption string
        """
        # TODO: Implement with BLIP or other captioning model
        # For now, return placeholder
        return "Frame from video"
