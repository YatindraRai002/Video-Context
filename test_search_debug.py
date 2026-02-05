"""Debug script to test search functionality"""
import asyncio
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

async def test_search():
    # Initialize
    model = SentenceTransformer('all-MiniLM-L6-v2')
    client = QdrantClient(host="localhost", port=6333)
    
    # Get the query embedding
    query = "papa"
    print(f"Query: {query}")
    embedding = model.encode([query])[0]
    print(f"Embedding shape: {embedding.shape}")
    print(f"Embedding (first 5 values): {embedding[:5]}")
    
    # Search
    print("\nSearching in Qdrant...")
    results = client.query_points(
        collection_name="transcript_embeddings",
        query=embedding.tolist(),
        limit=10
    ).points
    
    print(f"\nFound {len(results)} results:")
    for i, r in enumerate(results):
        print(f"\n Result {i+1}:")
        print(f"   Score: {r.score}")
        print(f"   Text: {r.payload.get('text', 'N/A')}")
        print(f"   Start: {r.payload.get('start_time', 'N/A')}")
        print(f"   End: {r.payload.get('end_time', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(test_search())
