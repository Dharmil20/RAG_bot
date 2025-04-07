from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
from ragPipeline import process_file, get_answer_from_query
import requests, tempfile, os
# import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileRequest(BaseModel):
    file_url: str
    
class QueryRequest(BaseModel):
    question: str

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
