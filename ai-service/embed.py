from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer
import uvicorn
import json

app = FastAPI()


print("Loading BAAI/bge-small-en-v1.5...")
model = SentenceTransformer('BAAI/bge-small-en-v1.5')

@app.post("/embed")
async def embed(request: Request):
    data = await request.json()
    texts = data.get("texts", [])
    
    if not texts:
        return []

    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()

if __name__ == "__main__":
    print("AI Embedding Service started on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
