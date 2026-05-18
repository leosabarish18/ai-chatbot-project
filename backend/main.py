from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "AI Backend Running"}

@app.post("/chat")
async def chat(req: ChatRequest):

    try:

        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "user",
                    "content": req.message
                }
            ]
        )

        reply = completion.choices[0].message.content

        return reply

    except Exception as e:

        return f"Backend Error: {str(e)}"