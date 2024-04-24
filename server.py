from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify domains if you want to restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/get_ipfs/{ipfs_hash}")
async def get_ipfs(ipfs_hash: str):
    if not ipfs_hash:
        raise HTTPException(status_code=400, detail="Missing IPFS hash")

    ipfs_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
    async with httpx.AsyncClient() as client:
        response = await client.get(ipfs_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch from IPFS gateway")
        

    return response.json()