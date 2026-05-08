from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import asyncio
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Ensure we load the .env file from the exact directory this file is in
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path=env_path)

api_key = os.environ.get("GEMINI_API_KEY", "")

# We configure with the key, or let it fail gracefully in the endpoint
if api_key:
    genai.configure(api_key=api_key)

# We use the recommended, fastest model
model = genai.GenerativeModel('gemini-2.5-flash')

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chatbot-1gfuzni0b-tonias-projects-cfc5cf88.vercel.app","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message:str

@app.get("/models")
async def list_models():
    if not api_key:
        return {"error": "API key not set"}
    try:
        available_models = [m.name for m in genai.list_models()]
        return {"models": available_models}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
async def chat(req:ChatRequest):
    if not api_key:
        print("Backend Error: GEMINI_API_KEY is missing from the .env file.")
        return {"response": "I'm sorry, the AI service is currently unavailable. Please try again later."}
    
    try:
        # Generate content with Gemini
        response = model.generate_content(req.message)
        return {
            "response": response.text
        }
    except Exception as e:
        # Log the exact error to the terminal/console for debugging
        print(f"Gemini Configuration/API Error: {str(e)}")
        # Send a simplified message to the React chat interface
        return {
            "response": "I'm sorry, I encountered a temporary network issue. Please try again in little while."
        }

@app.get("/chat-stream")
async def chat_stream(message: str = "Hello"):
    async def generate():
        try:
            # Stream response from Gemini
            response = model.generate_content(message, stream=True)
            for chunk in response:
                yield chunk.text
        except Exception as e:
            yield f"Error: {str(e)}"
    return StreamingResponse(generate(), media_type="text/plain")
