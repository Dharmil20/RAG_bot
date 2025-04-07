from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.llms import Cohere
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Paths
DB_FAISS_PATH = "vectorstore/db_faiss"

# Document processing function
def process_file(file_path):
    """Process PDF file into vector embeddings"""
    # 1. Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # 2. Chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    texts = text_splitter.split_documents(documents)

    # 3. Embedding model
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # 4. Vector store
    db = FAISS.from_documents(texts, embeddings)
    db.save_local(DB_FAISS_PATH)

    return len(texts)

# Format documents function (from image)
def format_docs(docs):
    """Combine document contents into a single string"""
    return "\n\n".join(doc.page_content for doc in docs)

# Main query function with upgraded RAG chain
def get_answer_from_query(query):
    """Get answer to user query using RAG pipeline"""
    # Load embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Ensure DB exists
    if not os.path.exists(DB_FAISS_PATH):
        raise FileNotFoundError(
            "Vectorstore not found. Please upload and process a document first."
        )

    # Load vector store and create retriever
    db = FAISS.load_local(
        DB_FAISS_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )
    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 6}  # Retrieve top 6 most similar documents
    )

    # Create prompt template (from image)
    prompt_template = """Answer the question as precise as possible using the provided context. 
    If the answer is not contained in the context, say "answer not available in context" \n\n
    Context: \n {context}?\n
    Question: \n {question} \n
    Answer:"""
    prompt = PromptTemplate.from_template(template=prompt_template)

    # Verify API key
    cohere_key = os.getenv("COHERE_API_KEY")
    if not cohere_key:
        raise ValueError("COHERE_API_KEY is not set in the environment variables.")

    # Create RAG chain (from image)
    cohere_llm = Cohere(
        model="command",
        temperature=0.1,
        cohere_api_key=cohere_key
    )
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | cohere_llm
        | StrOutputParser()
    )

    return rag_chain.invoke(query)