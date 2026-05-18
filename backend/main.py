from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# FastAPI app
app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class ChatRequest(BaseModel):
    message: str

# Home route
@app.get("/")
def home():
    return {"message": "AI Backend Running"}

# Chat route
from fastapi.responses import StreamingResponse
import json

@app.post("/chat")
async def chat(req: ChatRequest):

    user_message = req.message

    def generate():

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": user_message,
                "stream": True
            },
            stream=True
        )

        for line in response.iter_lines():

            if line:

                data = json.loads(line)

                token = data.get("response", "")

                yield token

    return StreamingResponse(generate(), media_type="text/plain")