# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
# from werkzeug.utils import secure_filename
# import os
# from PyPDF2 import PdfReader
# from docx import Document
# from pptx import Presentation
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import FAISS
# from langchain.embeddings import HuggingFaceEmbeddings
# from langchain_cohere import ChatCohere
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser
# from langchain_core.runnables import RunnablePassthrough
# import tempfile

app = Flask(__name__)
CORS(app)

@app.route('/api/upload', methods=['POST'])
def upload_files():
    

if __name__ == '__main__':
    app.run(debug=True, port=5000)