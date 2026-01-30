"""
Visual tagging service using Transfer Learning (ResNet50).
Auto-tags video frames with ImageNet categories.
"""

import torch
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from typing import List, Dict, Any
import json

class VisualTagger:
    """
    Uses pre-trained ResNet50 to tag images with ImageNet classes.
    """
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.transform = None
        self.labels = []
    
    def _load_model(self):
        """Lazy load ResNet50 model."""
        if self.model is None:
            print(f"Loading ResNet50 on {self.device}...")
            
            # Load pre-trained ResNet50
            # weights="IMAGENET1K_V1" is the standard pre-trained version
            self.model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
            self.model.to(self.device)
            self.model.eval()
            
            # Standard ImageNet transforms
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            
            # Load ImageNet class labels
            # We'll fetch them from a standard source if possible, or use a local mapping
            # For simplicity, we'll download/use standard list if we can,
            # but torchvision's weights provide the meta-data more reliably
            try:
                self.labels = models.ResNet50_Weights.IMAGENET1K_V1.meta["categories"]
            except:
                print("⚠️ Could not load ImageNet categories from weights meta")
                self.labels = []
                
            print("Visual Tagger loaded!")

    async def tag_frame(self, image_path: Path, top_k: int = 5) -> List[str]:
        """
        Generate tags for a single image.
        
        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return
            
        Returns:
            List of label strings (e.g. ['sports_car', 'racer', ...])
        """
        self._load_model()
        
        try:
            image = Image.open(image_path).convert("RGB")
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                output = self.model(input_tensor)
                
            # Get top-k probabilities and indices
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            top_prob, top_catid = torch.topk(probabilities, top_k)
            
            tags = []
            for i in range(top_k):
                idx = top_catid[i].item()
                if idx < len(self.labels):
                    # Clean up label (replace underscore with space, etc)
                    label = self.labels[idx].replace("_", " ")
                    tags.append(label)
                    
            return tags
            
        except Exception as e:
            print(f"Tagging failed for {image_path}: {e}")
            return []

visual_tagger = VisualTagger()
