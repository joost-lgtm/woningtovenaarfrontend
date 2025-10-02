"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Menu, X, Plus, Copy, Check, Send } from "lucide-react";
import LogoutButton from "../components/logoutButton";
import { Footer } from "../components/footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const WoningTovenaarLogo = ({ className = "w-10 h-10" }) => (
  <div className="flex items-center">
    <div className={`${className} flex items-center justify-center mr-3`}>
      <img src="logo.jpg" alt="WoningTovenaar" />
    </div>
  </div>
);

export default function WoningTovenaar() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [userInput]);

  useEffect(() => {
    if (mounted) {
      loadConversations().then((convs) => {
        const savedConversationId = localStorage.getItem(
          "activeConversationId"
        );
        if (
          savedConversationId &&
          convs.find((c) => c.sessionId === savedConversationId)
        ) {
          loadConversation(savedConversationId);
        } else if (convs.length > 0) {
          loadConversation(convs[0].sessionId);
        }
      });
    }
  }, [mounted]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("activeConversationId", currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      const data = await response.json();
      setConversations(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
  };

  const startNewConversation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/conversations/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "en" }),
      });

      const data = await response.json();
      setCurrentConversationId(data.sessionId);
      setMessages([
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);
      setTotalTokens(0);
      setInputTokens(0);
      setOutputTokens(0);
      setUserInput("");

      localStorage.setItem("activeConversationId", data.sessionId);
      await loadConversations();
    } catch (error) {
      console.error("Error starting conversation:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "Sorry, there was an error starting the conversation. Please try again.",
          timestamp: new Date(),
          error: true,
        },
      ]);
    }
    setLoading(false);
  };

  const loadConversation = async (sessionId) => {
    if (sessionId === currentConversationId) return;

    setLoading(true);
    setSidebarOpen(false);
    try {
      const response = await fetch(`${API_BASE}/conversations/${sessionId}`);
      const data = await response.json();

      setCurrentConversationId(sessionId);
      setTotalTokens(data.tokens?.total || 0);
      setInputTokens(data.tokens?.input || 0);
      setOutputTokens(data.tokens?.output || 0);

      const formattedMessages =
        data.messages?.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
          tokens: msg.tokens,
        })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!currentConversationId || !userInput.trim()) return;

    const userMessage = {
      role: "user",
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/conversations/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentConversationId,
          message: userMessage.content,
        }),
      });

      const data = await response.json();

      console.log(data, "datadatadata");
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            tokens: data.tokensUsed,
          },
        ]);
        setTotalTokens(data.conversationTokens?.total || 0);
        setInputTokens(data.conversationTokens?.input || 0);
        setOutputTokens(data.conversationTokens?.output || 0);

        await loadConversations();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.message || "Sorry, there was an error. Please try again.",
            timestamp: new Date(),
            error: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please try again.",
          timestamp: new Date(),
          error: true,
        },
      ]);
    }
    setLoading(false);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getConversationTitle = (conv) => {
    console.log(conv, "convconv");
    if (conv.title && conv.title.trim() !== "") {
      return conv.title;
    }
    return "New Chat";
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === "user";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-3xl rounded-lg px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-[#00a8a8] to-[#1e40af] text-white"
              : message.error
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          <ReactMarkdown className="prose prose-sm max-w-none prose-ul:list-disc prose-ol:list-decimal">
            {message.content.replace(/\\n/g, "\n")}
          </ReactMarkdown>

          <div
            className={`text-xs mt-2 flex items-center justify-between ${
              isUser ? "text-white/70" : "text-gray-500"
            }`}
          >
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.tokens && (
              <p className="text-xs text-gray-500 mt-1">
                Tokens used — Total: {message.tokens.total} | Input:{" "}
                {message.tokens.input} | Output: {message.tokens.output}
              </p>
            )}
          </div>

          {!isUser && !message.error && (
            <button
              onClick={() => handleCopy(message.content)}
              className="mt-2 text-xs flex items-center space-x-1 hover:text-[#00a8a8] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a8a8]"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white text-gray-900 transition-transform duration-300 ease-in-out flex flex-col shadow-xl`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <WoningTovenaarLogo className="w-32 h-16" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={startNewConversation}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-teal-700 text-white py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 font-medium transition-all shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-4">
            Conversations
          </h3>

          {conversations.length === 0 ? (
            <p className="text-sm text-center text-gray-500 italic">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={() => loadConversation(conv.sessionId)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    currentConversationId === conv.sessionId
                      ? "bg-gradient-to-r from-[#00a8a8] to-[#1e40af] text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getConversationTitle(conv)}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <MessageSquare className="w-4 h-4 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center lg:text-left">
              {currentConversationId ? (
                <div>
                  <h2 className="text-xl font-bold text-[#1e40af]">
                    WoningTovenaar Chat
                  </h2>
                  {totalTokens > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tokens used — Total: {totalTokens} | Input: {inputTokens}{" "}
                      | Output: {outputTokens}
                    </p>
                  )}
                </div>
              ) : (
                <WoningTovenaarLogo className="w-20 h-12" />
              )}
            </div>

            <LogoutButton />
          </div>
        </header>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
          {currentConversationId ? (
            <div className=" mx-auto">
              {messages.map((message, index) => renderMessage(message, index))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00a8a8]"></div>
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center text-center space-y-4 ">
                <WoningTovenaarLogo className="w-40" />
                <div>
                  <h1 className="text-4xl font-bold text-[#1e40af] mb-4">
                    Welcome to WoningTovenaar 🏠
                  </h1>
                  <p className="text-xl text-gray-600 max-w-md mx-auto">
                    Create professional property listings with AI assistance
                  </p>
                </div>
                <button
                  onClick={startNewConversation}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white font-medium py-4 px-8 rounded-lg text-lg disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {loading ? "Starting..." : "Start New Chat"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        {currentConversationId && (
          <div className="border-t border-gray-200 bg-white p-2">
            <div className=" mx-auto">
              <div className="flex items-center space-x-3">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 hide-scrollbar px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] resize-none shadow-sm"
                  placeholder="Type your message... (Shift+Enter for new line)"
                  rows="1"
                  style={{ maxHeight: "200px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !userInput.trim()}
                  className="bg-gradient-to-r h-fit w-auto from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium transition-all shadow-md flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
