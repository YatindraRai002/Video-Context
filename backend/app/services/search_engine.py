"""
Search engine service.
Orchestrates hybrid search across transcripts and frames.
"""

from typing import List, Dict, Any, Optional
import time

from app.services.embedder import Embedder
from app.services.vector_store import VectorStore
from app.models.schemas import SearchResultItem


class SearchEngine:
    """Multi-modal search engine for video content."""
    
    def __init__(self):
        self.embedder = Embedder()
        self.vector_store = VectorStore()
    
    async def search(
        self,
        query: str,
        video_id: Optional[str] = None,
        limit: int = 10,
        search_type: str = "hybrid"
    ) -> List[SearchResultItem]:
        """
        Execute a search query across video content.
        
        Args:
            query: Natural language search query
            video_id: Optional filter by specific video
            limit: Maximum number of results
            search_type: "transcript", "frames", or "hybrid"
            
        Returns:
            List of SearchResultItem objects
        """
        results = []
        
        if search_type in ["transcript", "hybrid"]:
            transcript_results = await self._search_transcripts(
                query, video_id, limit
            )
            results.extend(transcript_results)
        
        if search_type in ["frames", "hybrid"]:
            frame_results = await self._search_frames(
                query, video_id, limit
            )
            results.extend(frame_results)
        
        # Merge and deduplicate results by timestamp proximity
        if search_type == "hybrid":
            results = self._merge_results(results, limit)
        
        # Sort by score
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:limit]
    
    async def _search_transcripts(
        self,
        query: str,
        video_id: Optional[str],
        limit: int
    ) -> List[SearchResultItem]:
        """Search transcript embeddings."""
        # Generate text embedding
        embeddings = await self.embedder.embed_text([query])
        query_embedding = embeddings[0]
        
        # Search vector store
        matches = await self.vector_store.search_transcripts(
            query_embedding, video_id, limit
        )
        
        results = []
        for match in matches:
            results.append(SearchResultItem(
                video_id=match["video_id"],
                video_title="",  # Would be fetched from DB
                timestamp=match["start_time"],
                end_time=match["end_time"],
                transcript_snippet=match["text"],
                frame_path=None,
                frame_caption=None,
                score=match["score"],
                match_type="transcript"
            ))
        
        return results
    
    async def _search_frames(
        self,
        query: str,
        video_id: Optional[str],
        limit: int
    ) -> List[SearchResultItem]:
        """Search frame embeddings using CLIP."""
        # Generate CLIP text embedding
        embeddings = await self.embedder.embed_text_clip([query])
        query_embedding = embeddings[0]
        
        # Search vector store
        matches = await self.vector_store.search_frames(
            query_embedding, video_id, limit
        )
        
        results = []
        for match in matches:
            results.append(SearchResultItem(
                video_id=match["video_id"],
                video_title="",
                timestamp=match["timestamp"],
                end_time=None,
                transcript_snippet=None,
                frame_path=match["frame_path"],
                frame_caption=match.get("caption"),
                score=match["score"],
                match_type="frame"
            ))
        
        return results
    
    def _merge_results(
        self,
        results: List[SearchResultItem],
        limit: int
    ) -> List[SearchResultItem]:
        """
        Merge transcript and frame results by timestamp proximity.
        Combines overlapping results into single items.
        """
        if len(results) <= 1:
            return results
        
        # Group by video_id and sort by timestamp
        by_video: Dict[str, List[SearchResultItem]] = {}
        for r in results:
            if r.video_id not in by_video:
                by_video[r.video_id] = []
            by_video[r.video_id].append(r)
        
        merged = []
        time_threshold = 5.0  # seconds
        
        for video_id, video_results in by_video.items():
            video_results.sort(key=lambda x: x.timestamp)
            
            i = 0
            while i < len(video_results):
                current = video_results[i]
                
                # Look for nearby results to merge
                j = i + 1
                while j < len(video_results):
                    next_result = video_results[j]
                    if abs(next_result.timestamp - current.timestamp) <= time_threshold:
                        # Merge: combine data
                        if current.match_type == "transcript" and next_result.match_type == "frame":
                            current.frame_path = next_result.frame_path
                            current.frame_caption = next_result.frame_caption
                            current.match_type = "both"
                            current.score = max(current.score, next_result.score)
                        elif current.match_type == "frame" and next_result.match_type == "transcript":
                            current.transcript_snippet = next_result.transcript_snippet
                            current.end_time = next_result.end_time
                            current.match_type = "both"
                            current.score = max(current.score, next_result.score)
                        j += 1
                    else:
                        break
                
                merged.append(current)
                i = j if j > i + 1 else i + 1
        
        return merged
