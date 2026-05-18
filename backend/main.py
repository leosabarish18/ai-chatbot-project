from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import json

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
@app.post("/chat")
async def chat(req: ChatRequest):

    user_message = req.message

    def generate():

        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "mistral",
                    "prompt": user_message,
                    "stream": True
                },
                stream=True,
                timeout=60
            )

            for line in response.iter_lines():

                if line:

                    data = json.loads(line)

                    token = data.get("response", "")

                    yield token

        except Exception as e:
            yield f"Backend Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")