import os 
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

llm = ChatGroq(api_key = groq_api_key, model="openai/gpt-oss-20b")

response = llm.invoke("give me c code for sum of 2 numbers?")
print(response.content)