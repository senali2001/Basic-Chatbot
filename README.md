# Ares Chatbot

A high-performance, full-stack AI chatbot application featuring a responsive Next.js frontend and a FastAPI backend. The chatbot leverages LangChain and the Groq API for rapid inference and preserves conversation history persistently across sessions using MongoDB.

---

## 🚀 Key Features

*   **Responsive Dark-Mode Interface:** A modern, premium UI inspired by industry standards, featuring fluid transitions, dynamic auto-resizing textareas, and an overlay-supported sidebar for mobile viewports.
*   **Persistent Conversation History:** Chat histories are saved in MongoDB and retrieved dynamically to provide contextual conversations.
*   **Rich Markdown Support:** Responses rendered on the frontend support rich Markdown elements like headings, bulleted lists, tables, bold text, and code blocks using `react-markdown`.
*   **Searchable Chat History:** A client-side search bar allows users to search through titles and messages of past conversations instantly.
*   **Quick Suggestions:** Interactive templates to help users get started immediately with predefined topics (study plans, conceptual explanations, UI design tips, and Markdown templates).

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** [Next.js](https://nextjs.org/) (App Router, v15+)
*   **Library:** [React](https://react.dev/) (v19)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **Markdown Parsing:** `react-markdown` and `rehype-raw`

### Backend & Database
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
*   **LLM Orchestration:** [LangChain](https://www.langchain.com/) & `langchain-groq`
*   **Inference Engine:** [Groq Cloud API](https://groq.com/) (using the `openai/gpt-oss-20b` model)
*   **Database:** [MongoDB](https://www.mongodb.com/) (via `pymongo` client)
*   **Server:** [Uvicorn](https://www.uvicorn.org/)

---

## 📂 Project Structure

```text
Basic-Chatbot/
├── app.py                  # FastAPI Backend API & LangChain configurations
├── requirements.txt        # Python dependency list
├── package.json            # Root configuration and markdown packages
├── README.md               # Project documentation (this file)
└── frontend/               # Next.js Frontend application
    ├── app/
    │   ├── page.tsx        # Main chatbot chat UI component
    │   ├── globals.css     # Theme design systems & variables
    │   └── layout.tsx      # Next.js global layout
    ├── package.json        # Frontend NPM configurations
    └── tsconfig.json       # TypeScript configuration
```

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/) (v3.10 or higher)
*   [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a MongoDB Atlas URI)

---

### 1. Environment Configuration

Create a `.env` file in the **root** directory of the project:

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://localhost:27017/
```

*Note: Replace `your_groq_api_key_here` with a valid API key from [Groq Console](https://console.groq.com/).*

---

### 2. Backend Setup

1.  **Navigate to the root directory** and activate a virtual environment:
    ```bash
    # Create a virtual environment (if not already done)
    python -m venv .venv

    # Activate the virtual environment
    # On Windows (PowerShell):
    .venv\Scripts\Activate.ps1
    # On macOS/Linux:
    source .venv/bin/activate
    ```

2.  **Install the required packages**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the FastAPI server**:
    ```bash
    uvicorn app:app --reload --port 8000
    ```
    *The API will start running on `http://localhost:8000`.*

---

### 3. Frontend Setup

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Next.js development server**:
    ```bash
    npm run dev
    ```
    *The frontend will start running on `http://localhost:3000`.*

---

## 🔌 API Endpoints

The backend exposes the following endpoints:

### `GET /`
*   **Description:** Health check and root greeting.
*   **Response:**
    ```json
    {
      "message": "Welcome to the Chatbot API! interact with the incredible chatbot."
    }
    ```

### `POST /chat`
*   **Description:** Submits a question, retains chat context using history, saves the exchange to MongoDB, and returns the AI response.
*   **Payload Schema:**
    ```json
    {
      "user_id": "string (unique identifier for the chat session)",
      "question": "string (the user prompt)"
    }
    ```
*   **Response:**
    ```json
    {
      "response": "string (markdown-formatted AI response)"
    }
    ```

---

## 🎨 System Prompt & AI Behavior

The backend instructs the chatbot using a custom-defined system instructions template to format answers cleanly:
*   Structured tables, lists, and proper spacing.
*   Markdown styling (headings, code blocks, bold markers).
*   Contextual awareness by injecting database-stored chat history into each invocation.
