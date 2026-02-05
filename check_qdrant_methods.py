from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)
print("Available methods:")
methods = [m for m in dir(client) if 'search' in m.lower() or 'query' in m.lower()]
for m in methods:
    print(f"  - {m}")
