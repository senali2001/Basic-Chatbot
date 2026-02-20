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
# It reads your GROQ_API_KEY from the file
load_dotenv()

# This key is needed to connect to Groq API and use their language model services
groq_api_key = os.getenv("GROQ_API_KEY")
mongo_uri = os.getenv("MONGODB_URI")

client = MongoClient(mongo_uri)
db = client["chat"]
collection = db["users"]

#app = FastAPI()



#app.add_middleware(
 #   CORSMiddleware,
  #  allow_origins=["*"],  # Allow all origins (you can restrict this in production)
   # allow_methods=["*"],  # Allow all HTTP methods
    #allow_headers=["*"],  # Allow all headers
    #allow_credentials=True,  # Allow cookies and credentials
#)

# Create a prompt template
# It has:
# 1. A system message (tells the AI its role)
# 2. A user message (contains a variable called {question})
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are best adviser, give me advice for my education"),
        ("placeholder", "{history}"), # This is where the conversation history will be inserted
        ("user","{question}")
    ]
)

# Send a question to the AI
# The {question} variable inside prompt will be replaced
llm = ChatGroq(api_key = groq_api_key, model="openai/gpt-oss-20b")# 20 billion parameter model from Groq, you can choose other models as well
chain = prompt | llm

user_id = "user123"#different users use this chat bot therefore i assigned userID to this
def get_history(user_id):
   chats = collection.find({"user_id": user_id}).sort("timestamp", 1) # Sort by timestamp in ascending order
   history = []

   for chat in chats:
        history.append((chat["role"], chat["message"]))
   return history
            
        
#app.get("/")#root rout
#def home():
   # return {"message": "Welcome to the Chatbot API! interact with the incredible chatbot."}

while True:#trought loop we can ask multiple question without pre define
    question = input ("Ask a question:")

    if question.lower() in ["exit", "quit"]:
        break
    
    history = get_history(user_id)


    response = chain.invoke({"history": history, "question": question})

    collection.insert_one({
      "user_id": user_id,
      "role": "user",
      "message": question,
      "timestamp": datetime.utcnow()
    })
    collection.insert_one({
        "user_id": user_id,
        "role": "assistant",
        "message": response.content,
        "timestamp": datetime.utcnow()
    })
    print(response.content)