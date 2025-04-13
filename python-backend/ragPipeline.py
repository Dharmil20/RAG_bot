from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.llms import Cohere
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from dotenv import load_dotenv
import asyncio
import os

# Load environment variables
load_dotenv()

# Constants
DB_FAISS_PATH = "vectorstore/db_faiss"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
COHERE_MODEL = "command"
COHERE_TEMPERATURE = 0.1

# Initialize components once (singleton pattern)
_embeddings = None
_db = None
_rag_chain = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings

def get_vector_store():
    global _db
    if _db is None:
        if not os.path.exists(DB_FAISS_PATH):
            raise FileNotFoundError(
                "Vectorstore not found. Please upload and process a document first."
            )
        _db = FAISS.load_local(
            DB_FAISS_PATH,
            get_embeddings(),
            allow_dangerous_deserialization=True
        )
    return _db

def get_rag_chain():
    global _rag_chain
    if _rag_chain is None:
        # Verify API key
        cohere_key = os.getenv("COHERE_API_KEY")
        if not cohere_key:
            raise ValueError("COHERE_API_KEY is not set in environment variables")

        # Create RAG chain
        cohere_llm = Cohere(
            model=COHERE_MODEL,
            temperature=COHERE_TEMPERATURE,
            cohere_api_key=cohere_key
        )
        
        prompt_template = """Answer the question as precise as possible using the provided context. 
        If the answer is not contained in the context, say "answer not available in context" \n\n
        Context: \n {context}?\n
        Question: \n {question} \n
        Answer:"""
        prompt = PromptTemplate.from_template(template=prompt_template)

        _rag_chain = (
            {"context": get_retriever() | format_docs, "question": RunnablePassthrough()}
            | prompt
            | cohere_llm
            | StrOutputParser()
        )
    return _rag_chain

def get_retriever():
    return get_vector_store().as_retriever(
        search_type="similarity",
        search_kwargs={"k": 6}
    )

def format_docs(docs):
    """Combine document contents into a single string"""
    return "\n\n".join(doc.page_content for doc in docs)

def process_file(file_path):
    """Process PDF file into vector embeddings"""
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        texts = text_splitter.split_documents(documents)

        db = FAISS.from_documents(texts, get_embeddings())
        db.save_local(DB_FAISS_PATH)
        
        # Clear cached instances to force reload
        global _db, _rag_chain
        _db = None
        _rag_chain = None
        
        return len(texts)
    except Exception as e:
        raise RuntimeError(f"Failed to process file: {str(e)}")

def get_answer_from_query(query):
    """Get complete answer (non-streaming)"""
    try:
        return get_rag_chain().invoke(query)
    except Exception as e:
        raise RuntimeError(f"Query processing failed: {str(e)}")

async def stream_answer(query):
    """Stream answer chunks with proper error handling"""
    try:
        rag_chain = get_rag_chain()
        async for chunk in rag_chain.astream(query):
            # Properly format as SSE
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.1)  # Control stream speed
    except Exception as e:
        # Yield error as SSE message
        yield f"data: Error: {str(e)}\n\n"
        raise  # Re-raise for FastAPI to handle