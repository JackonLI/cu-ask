from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

@app.post("/api/chat")
def chat(payload: ChatMessage):
    # Simulated chatbot response
    return {"reply": f"CU-Ask Bot received your message: '{payload.message}'. This is a simulated response!"}
