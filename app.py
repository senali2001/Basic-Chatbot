# This is used to access environment variables (like API keys)
import datetime
import os 
from dotenv import load_dotenv# This loads environment variables from a .env file into the system's environment variables, making them accessible via os.getenv()
from langchain_groq import ChatGroq  #This allows us to use Groq's LLM through LangChain
from langchain_core.prompts import ChatPromptTemplate # This helps us create structured prompts (system + user messages)
from pymongo import MongoClient # This is the MongoDB client to connect to our database
from datetime import datetime # This is used to get the current timestamp when saving messages to the database
from fastapi import FastAPI, Form # This is used to create a web server and handle form data
from fastapi.middleware.cors import CORSMiddleware # This is used to handle Cross-Origin Resource Sharing (CORS) for our API
from pydantic import BaseModel # This is used to define data models for request validation in FastAPI

# It reads your GROQ_API_KEY from the file
load_dotenv()

# This key is needed to connect to Groq API and use their language model services
groq_api_key = os.getenv("GROQ_API_KEY")
mongo_uri = os.getenv("MONGODB_URI")

client = MongoClient(mongo_uri)
db = client["chat"]
collection = db["users"]

app = FastAPI()

class ChatRequest(BaseModel):
    user_id: str
    question: str

app.add_middleware(
 CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can restrict this in production)
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    allow_credentials=True,  # Allow cookies and credentials
)

# Create a prompt template
# It has:
# 1. A system message (tells the AI its role)
# 2. A user message (contains a variable called {question})
prompt = ChatPromptTemplate.from_messages(
    [
       # ("system", "You are best adviser, give me advice for my education"), this is basic one but now i need proper format so i change that
       ("system", """
You are a professional AI assistant.

Always format answers clearly using:

- Proper headings
- Bullet points
- Tables (when needed)
- Bold important words
- Clean spacing

Use Markdown formatting.
Make answers structured and easy to read.
"""),
        ("placeholder", "{history}"), # This is where the conversation history will be inserted
        ("user","{question}")
    ]
)

# Send a question to the AI
# The {question} variable inside prompt will be replaced
llm = ChatGroq(api_key = groq_api_key, model="openai/gpt-oss-20b")# 20 billion parameter model from Groq, you can choose other models as well
chain = prompt | llm


#user_id = "user123"#different users use this chat bot therefore i assigned userID to this

def get_history(user_id):
   chats = collection.find({"user_id": user_id}).sort("timestamp", 1) # Sort by timestamp in ascending order
   history = []

   for chat in chats:
        history.append((chat["role"], chat["message"]))
   return history
            
        
@app.get("/")#root rout
def home():
    return {"message": "Welcome to the Chatbot API! interact with the incredible chatbot."}

@app.post("/chat")#chat route
def chat(request: ChatRequest):
        history = get_history(request.user_id)
        response = chain.invoke({"history": history, "question": request.question})
        
        
        collection.insert_one({
             "user_id": request.user_id,
             "role": "user",
             "message": request.question,
             "timestamp": datetime.utcnow()
    })
        collection.insert_one({
             "user_id": request.user_id,
             "role": "assistant",
             "message": response.content,
             "timestamp": datetime.utcnow()
    })
        return {"response": response.content}



