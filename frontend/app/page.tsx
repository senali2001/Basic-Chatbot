"use client";
import ReactMarkdown from "react-markdown";
//cannot import without upgrade node
//import remarkGfm from "remark-gfm";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

 const userId =
  typeof window !== "undefined"
    ? localStorage.getItem("user_id") ||
      (() => {
        const newId = "user_" + Math.random().toString(36).substring(2);
        localStorage.setItem("user_id", newId);
        return newId;
      })()
    : "";//multiple users give their own history based questions
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const updatedChat: Message[] = [
      ...chat,
      { role: "user", text: message },
    ];

    setChat(updatedChat);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question: message,
        }),
      });

      const data = await res.json();

      setChat([
        ...updatedChat,
        { role: "assistant", text: data.response },
      ]);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
    setMessage("");
  };

  return (
    <div className="container">
      <h1>My AI Chatbot</h1>

      <div className="chatBox">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={msg.role === "user" ? "userMsg" : "botMsg"}
          >
          <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}

        {loading && <div className="botMsg">Thinking...</div>}

        <div ref={chatEndRef}></div>
      </div>

      <div className="inputArea">
        <input
          type="text"
          placeholder="Ask something..."
          value={message}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}