import os 
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are best adviser, give me advice for my education"),
        ("user","{question}")
    ]
)

llm = ChatGroq(api_key = groq_api_key, model="openai/gpt-oss-20b")
chain = prompt | llm
response = chain.invoke({"question": "What should I do to improve my learning?"})
print(response.content)