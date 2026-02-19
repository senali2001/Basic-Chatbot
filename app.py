# This is used to access environment variables (like API keys)
import datetime
import os 
from dotenv import load_dotenv# This loads environment variables from a .env file into the system's environment variables, making them accessible via os.getenv()
from langchain_groq import ChatGroq  #This allows us to use Groq's LLM through LangChain
from langchain_core.prompts import ChatPromptTemplate # This helps us create structured prompts (system + user messages)
from pymongo import MongoClient # This is the MongoDB client to connect to our database
from datetime import datetime # This is used to get the current timestamp when saving messages to the database

# It reads your GROQ_API_KEY from the file
load_dotenv()

# This key is needed to connect to Groq API and use their language model services
groq_api_key = os.getenv("GROQ_API_KEY")
mongo_uri = os.getenv("MONGODB_URI")

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

try:
    client.server_info()
    print("✅ MongoDB Connected Successfully")
except Exception as e:
    print("❌ MongoDB Connection Failed")
    print(e)
db = client["chat"]
collection = db["users"]


# Create a prompt template
# It has:
# 1. A system message (tells the AI its role)
# 2. A user message (contains a variable called {question})
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are best adviser, give me advice for my education"),
        ("user","{question}")
    ]
)

# Send a question to the AI
# The {question} variable inside prompt will be replaced
llm = ChatGroq(api_key = groq_api_key, model="openai/gpt-oss-20b")# 20 billion parameter model from Groq, you can choose other models as well
chain = prompt | llm

user_id = "user123"#different users use this chat bot therefore i assigned userID to this

while True:#trought loop we can ask multiple question without pre define
    question = input ("Ask a question:")

    if question.lower() in ["exit", "quit"]:
        break
    
    response = chain.invoke({"question": question})

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