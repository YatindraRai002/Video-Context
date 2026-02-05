from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

client = QdrantClient(host="localhost", port=6333)
model = SentenceTransformer('all-MiniLM-L6-v2')

query = "papa"
embedding = model.encode([query])[0]

print("Testing different search methods:")

# Try method 1: query
try:
    print("\n1. Using client.query()...")
    results = client.query(
        collection_name="transcript_embeddings",
        query=embedding.tolist(),
        limit=10
    )
    print(f"   Success! Found {len(results)} results")
    if results:
        print(f"   First result score: {results[0].score}")
except Exception as e:
    print(f"   Failed: {e}")

# Try method 2: query_points
try:
    print("\n2. Using client.query_points()...")
    response = client.query_points(
        collection_name="transcript_embeddings",
        query=embedding.tolist(),
        limit=10
    )
    results = response.points
    print(f"   Success! Found {len(results)} results")
    if results:
        print(f"   First result score: {results[0].score}")
except Exception as e:
    print(f"   Failed: {e}")
