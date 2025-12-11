import warnings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitter import RecursiveCharacterTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.llms import Cohere
from langchain_cohere import ChatCohere
# from langchain.prompts import PromptTemplate
# from langchain.schema.runnable import RunnablePassthrough
# from langchain.schema.output_parser import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import asyncio
import os

warnings.filterwarnings("ignore")

# Load environment variables
load_dotenv()

# Constants
DB_FAISS_PATH = "vectorstore/db_faiss"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
COHERE_MODEL = "command-a-03-2025"
COHERE_TEMPERATURE = 0.1

# Initialize components once (singleton pattern)
_embeddings = None
_db = None
_rag_chain = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL, 
            # model_kwargs={"device": "cpu"}, 
            # encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
            )
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
        cohere_llm = ChatCohere(
            model=COHERE_MODEL,
            temperature=COHERE_TEMPERATURE,
            cohere_api_key=cohere_key
        )
        
        prompt_template = """Answer the question as precisely as possible using only the provided context. You are a chatbot for
        DJSCE - Dwarkadas Jivanlal Sanghvi College of Engineering. There are 8 branches in our college; they are, Electronics & Telecommunication
        Engineering, Information Technology, Computer Engineering, Mechanical Engineering, Computer Science and Engineering (Data Science), 
        Artificial Intelligence and Machine Learning, Artificial Intelligence (AI) and Data Science, Computer Science and Engineering 
        (IOT and Cyber Security with Block Chain Technology).You are expected to give response when a Student provides with a Document regarding 
        a branch of Engineering in DJSCE. STRICTLY FOLLOW THESE FORMATTING RULES:
        1. If the answer is not in the context, respond with: "Answer not available in context"
        2. For list-type answers:
        - Begin each item on a new line
        - Start with 1. ListItem1\n2. ListItem2\n, etc. followed by exactly one space
        - Do not add any extra information or commentary
        3. For other questions, provide the most concise answer possible from the context
        4. Never add information not present in the context

        Context: {context}

        Question: {question}

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
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=[
                '\n\n',        # Major section breaks (double newline)
                '\.\s+\n',    # Sentence endings followed by newline
                '\n',          # Regular line breaks
                '\.\s+',       # Sentence endings
                ';',           # Semi-colons
                ',\s+',        # Commas
                '\s+',         # Whitespace
                ''             # Fallback (character-level)
            ],
            # Additional optimization parameters
            keep_separator=True,      # Preserve separators in output
            is_separator_regex=True,  # Treat separators as regex patterns
            strip_whitespace=True   
        )
        texts = text_splitter.split_documents(documents)

        texts = [doc for doc in texts if len(doc.page_content.strip()) > 50]

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