from fastapi import FastAPI,HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ragPipeline import process_file, stream_answer, get_answer_from_query
import requests, tempfile, os
import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_text(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

class FileRequest(BaseModel):
    file_url: str
    
class QueryRequest(BaseModel):
    question: str
    
manager = ConnectionManager()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive the question from the client
            question = await websocket.receive_text()
            
            try:
                # Get the full answer
                full_answer = get_answer_from_query(question)
                
                # For proper list formatting, we need to preserve newlines when streaming
                # Split by lines first to maintain the structure
                lines = full_answer.split('\n')
                
                for i, line in enumerate(lines):
                    # Split each line into words
                    words = line.split()
                    
                    # Stream words in each line
                    for j, word in enumerate(words):
                        suffix = " " if j < len(words) - 1 else ""
                        await manager.send_text(word + suffix, websocket)
                        await asyncio.sleep(0.02)  # Slightly faster for better UX
                    
                    # Add newline between lines (except for the last line)
                    if i < len(lines) - 1:
                        await manager.send_text("\n", websocket)
                        await asyncio.sleep(0.05)  # Small pause after newline
                
            except Exception as e:
                await manager.send_text(f"Error: {str(e)}", websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/process")
def process_file_from_url(req: FileRequest):
    file_url = req.file_url

    response = requests.get(file_url)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(response.content)
        file_path = tmp.name

    try:
        vector_count = process_file(file_path)
        return {"message": "File processed", "vector_count": vector_count}
    finally:
        os.remove(file_path)
        
@app.post("/query")
def query_rag(req: QueryRequest):
    answer = get_answer_from_query(req.question)
    return {"answer": answer}

@app.post("/stream")
async def stream_response(req: QueryRequest):
    """Stream the response from the LLM"""
    try:
        return StreamingResponse(
            stream_answer(req.question),
            media_type="text/event-stream",
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))