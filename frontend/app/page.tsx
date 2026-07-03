"use client";

import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load conversations from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ares_chatbot_conversations");
      const storedActive = localStorage.getItem("ares_chatbot_active_id");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Conversation[];
          setConversations(parsed);
          if (storedActive && parsed.some(c => c.id === storedActive)) {
            setActiveId(storedActive);
          } else if (parsed.length > 0) {
            setActiveId(parsed[0].id);
          }
        } catch (e) {
          console.error("Failed to parse stored conversations", e);
        }
      }
    }
  }, []);

  // Save conversations to local storage when state changes
  const saveToStorage = (updatedConvs: Conversation[], currentActiveId: string | null) => {
    localStorage.setItem("ares_chatbot_conversations", JSON.stringify(updatedConvs));
    if (currentActiveId) {
      localStorage.setItem("ares_chatbot_active_id", currentActiveId);
    } else {
      localStorage.removeItem("ares_chatbot_active_id");
    }
  };

  // Auto scroll to bottom
  const activeConversation = conversations.find(c => c.id === activeId);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, loading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight - 8, 200)}px`;
    }
  }, [message]);

  const createNewChat = () => {
    const newId = "chat_" + Math.random().toString(36).substring(2, 11);
    const newChat: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [],
      timestamp: Date.now(),
    };
    const updated = [newChat, ...conversations];
    setConversations(updated);
    setActiveId(newId);
    saveToStorage(updated, newId);
    setSidebarOpen(false);
    setMessage("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const deleteChat = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== idToDelete);
    setConversations(updated);
    
    let nextActive = activeId;
    if (activeId === idToDelete) {
      nextActive = updated.length > 0 ? updated[0].id : null;
      setActiveId(nextActive);
    }
    saveToStorage(updated, nextActive);
  };

  const handleSuggestionClick = (promptText: string) => {
    setMessage(promptText);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const sendMessage = async () => {
    const textToSend = message.trim();
    if (!textToSend || loading) return;

    let currentActiveId = activeId;
    let updatedConversations = [...conversations];
    let activeChat = updatedConversations.find(c => c.id === currentActiveId);

    // If no active conversation exists, create one
    if (!activeChat) {
      const newId = "chat_" + Math.random().toString(36).substring(2, 11);
      const titleText = textToSend.length > 28 ? textToSend.substring(0, 25) + "..." : textToSend;
      const newChat: Conversation = {
        id: newId,
        title: titleText,
        messages: [],
        timestamp: Date.now(),
      };
      updatedConversations = [newChat, ...updatedConversations];
      currentActiveId = newId;
      activeChat = newChat;
      setActiveId(newId);
    } else if (activeChat.messages.length === 0) {
      // Update first conversation title based on first query
      activeChat.title = textToSend.length > 28 ? textToSend.substring(0, 25) + "..." : textToSend;
    }

    const userMsg: Message = { role: "user", text: textToSend };
    activeChat.messages = [...activeChat.messages, userMsg];
    activeChat.timestamp = Date.now();

    // Reorder: put current conversation first in sidebar list
    const filtered = updatedConversations.filter(c => c.id !== currentActiveId);
    const sorted = [activeChat, ...filtered];

    setConversations(sorted);
    setLoading(true);
    setMessage("");
    saveToStorage(sorted, currentActiveId);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentActiveId,
          question: textToSend,
        }),
      });

      const data = await res.json();
      
      // Update conversation with assistant response
      const botResponseMsg: Message = { role: "assistant", text: data.response };
      const updatedAfterResponse = sorted.map(c => {
        if (c.id === currentActiveId) {
          return {
            ...c,
            messages: [...c.messages, botResponseMsg],
          };
        }
        return c;
      });

      setConversations(updatedAfterResponse);
      saveToStorage(updatedAfterResponse, currentActiveId);
    } catch (error) {
      console.error("Error communicating with chatbot API:", error);
      
      const errorMsg: Message = { 
        role: "assistant", 
        text: "**Failed to connect to AI server.** Please make sure the backend is running locally on port `8000`." 
      };
      
      const updatedAfterError = sorted.map(c => {
        if (c.id === currentActiveId) {
          return {
            ...c,
            messages: [...c.messages, errorMsg],
          };
        }
        return c;
      });
      setConversations(updatedAfterError);
      saveToStorage(updatedAfterError, currentActiveId);
    }

    setLoading(false);
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = c.title.toLowerCase().includes(query);
    const messagesMatch = c.messages.some(m => m.text.toLowerCase().includes(query));
    return titleMatch || messagesMatch;
  });

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Left Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-text">Ares Chatbot</span>
        </div>

        <div className="new-chat-wrapper">
          <button className="btn-new-chat" onClick={createNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>

        <div className="sidebar-search-container">
          <div className="search-wrapper">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-history">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div 
                key={conv.id} 
                className={`chat-card ${conv.id === activeId ? "active" : ""}`}
                onClick={() => {
                  setActiveId(conv.id);
                  setSidebarOpen(false);
                  setMessage("");
                }}
              >
                <div className="chat-card-info">
                  <svg className="chat-card-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="chat-card-title">{conv.title}</span>
                </div>
                <button 
                  className="btn-delete-chat" 
                  onClick={(e) => deleteChat(e, conv.id)}
                  title="Delete chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "20px" }}>
              {searchQuery ? "No results found" : "No active chats"}
            </div>
          )}
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">A</div>
          <div className="profile-info">
            <span className="profile-name">Guest User</span>
            <span className="profile-role">Pro Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="chat-header">
          <div className="header-left">
            <button 
              className="btn-hamburger" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span className="chat-header-title">
              {activeConversation ? activeConversation.title : "Ares AI Chatbot"}
            </span>
          </div>
          <div className="chat-header-actions">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(229, 57, 53, 0.1)", padding: "4px 8px", borderRadius: "12px", border: "1px solid rgba(229, 57, 53, 0.2)" }}>
              Model: GPT-OSS-20B
            </span>
          </div>
        </header>

        {/* Message Panel */}
        <div className="chat-messages-container">
          {activeConversation && activeConversation.messages.length > 0 ? (
            activeConversation.messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="message-container">
                  {msg.role === "assistant" && (
                    <div className="message-avatar bot">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M12 2v2"></path>
                        <path d="M8 5h8"></path>
                        <circle cx="8" cy="14" r="1"></circle>
                        <circle cx="16" cy="14" r="1"></circle>
                      </svg>
                    </div>
                  )}
                  <div className="message-bubble">
                    {msg.role === "user" ? (
                      <div>{msg.text}</div>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2 className="empty-state-title">How can I help you today?</h2>
              <p className="empty-state-desc">
                Ask about education planning, general advice, coding tasks, or try one of the suggestions below to get started.
              </p>
              <div className="empty-state-suggestions">
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Create a step-by-step roadmap to learn web development in 2026.")}
                >
                  <div className="suggestion-card-title">Study Plan</div>
                  <div className="suggestion-card-desc">Create a roadmap to learn web development.</div>
                </div>
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Explain how database indexes speed up lookups like I am 5.")}
                >
                  <div className="suggestion-card-title">Explain Concept</div>
                  <div className="suggestion-card-desc">Explain database indexes simply.</div>
                </div>
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Recommend 5 core elements of clean dark-mode UI design.")}
                >
                  <div className="suggestion-card-title">Design Guidelines</div>
                  <div className="suggestion-card-desc">Elements of clean dark-mode design.</div>
                </div>
                <div 
                  className="suggestion-card" 
                  onClick={() => handleSuggestionClick("Show me a template for a clean markdown tables format.")}
                >
                  <div className="suggestion-card-title">Markdown Formatting</div>
                  <div className="suggestion-card-desc">Show a template for clean tables.</div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="message-wrapper assistant">
              <div className="message-container">
                <div className="message-avatar bot">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M12 2v2"></path>
                    <path d="M8 5h8"></path>
                    <circle cx="8" cy="14" r="1"></circle>
                    <circle cx="16" cy="14" r="1"></circle>
                  </svg>
                </div>
                <div className="message-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Bar */}
        <footer className="chat-footer">
          <div className="input-container-wrapper">
            <div className="input-box">
              <textarea 
                ref={textareaRef}
                className="chat-textarea" 
                rows={1}
                placeholder="Ask Ares anything..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button 
                className="btn-send" 
                onClick={sendMessage}
                disabled={!message.trim() || loading}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="chat-disclaimer">
              Ares AI may provide educational and programming guidance. Double check critical details.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}