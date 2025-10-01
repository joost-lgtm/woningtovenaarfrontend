"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

import {
  Home,
  MessageSquare,
  FileText,
  CheckCircle,
  Settings,
  Menu,
  X,
  Plus,
  CreditCard as Edit3,
  Trash2,
  AlertCircle,
  Check,
  Copy,
} from "lucide-react";
import { Footer } from "../components/footer";
import LogoutButton from "../components/logoutButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Logo component
const WoningTovenaarLogo = ({
  className = "w-10 h-10 bg-black",
  textSize = "text-lg",
}) => (
  <div className="flex items-center">
    <div className={`${className} flex items-center justify-center mr-3`}>
      <img src="logo.jpg" alt="" />
    </div>
  </div>
);

export default function WoningTovenaar() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [stepData, setStepData] = useState({});
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [uniqueDetail, setUniqueDetail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingMode, setEditingMode] = useState(null); // New state for editing modes
  const [editContent, setEditContent] = useState(""); // New state for edit content
  const [validationError, setValidationError] = useState(""); // New state for validation errors

  const [copied, setCopied] = useState(false);

  const [msgLoading, setMsgLoading] = useState(false);

  const router = useRouter();
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!isAuthenticated) {
 
      router.push("/");
    }
  }, [router]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  console.log(currentStep, "currentStepcurrentStep");
  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const steps = [
    { id: 1, title: "Transaction", icon: Home },
    { id: 2, title: "Property Type", icon: Home },
    { id: 3, title: "Basic Features", icon: FileText },
    { id: 4, title: "Highlights", icon: CheckCircle },
    { id: 5, title: "Target Audience", icon: MessageSquare },
    { id: 6, title: "Persona & Q&A", icon: MessageSquare },
    { id: 7, title: "Final Text", icon: FileText },
    { id: 8, title: "Listing Generated", icon: CheckCircle },
  ];

  const tryParseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const renderPersonaObject = (persona) => {
    if (typeof persona === "string") {
      const parsed = tryParseJSON(persona);
      if (typeof parsed === "object") {
        return renderPersonaObject(parsed);
      }
      return <p>{parsed}</p>;
    }

    if (typeof persona !== "object" || persona === null) {
      return <p>Invalid persona data</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(persona).map(([key, value], index) => (
          <div key={key} className="flex items-start space-x-2">
            <span className="text-[#00a8a8] font-medium text-sm mt-1">
              {index + 1}.
            </span>
            <div>
              <p className="text-gray-800 font-medium capitalize">
                {key.replace("_", " ")}
              </p>
              <div className="text-gray-700 text-sm leading-relaxed ml-4">
                {renderPersonaValue(value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPersonaValue = (value) => {
    if (typeof value === "string") {
      const parsed = tryParseJSON(value);
      if (typeof parsed === "object") {
        return renderPersonaValue(parsed);
      }
      return <p>{parsed}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc ml-5 space-y-1">
          {value.map((item, idx) => (
            <li key={idx} className="text-gray-700 text-sm">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    } else if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="flex items-start space-x-2">
              <span className="text-[#00a8a8] font-medium text-xs mt-1">–</span>
              <p className="text-gray-700 text-sm">
                <span className="font-medium capitalize">
                  {subKey.replace("_", " ")}:
                </span>{" "}
                {typeof subValue === "string"
                  ? subValue
                  : renderPersonaValue(subValue)}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  // Load conversations on mount
  useEffect(() => {
    if (mounted) {
      loadConversations().then((convs) => {
        if (convs.length > 0 && !currentConversationId) {
          // Load the first (most recent) conversation
          loadConversation(convs[0].sessionId);
        }
      });
    }
  }, [mounted]);

  // Save current conversation ID to localStorage whenever it changes
useEffect(() => {
  if (currentConversationId) {
    localStorage.setItem('activeConversationId', currentConversationId);
  }
}, [currentConversationId]);

// Load saved conversation from localStorage on mount
useEffect(() => {
  if (mounted) {
    const savedConversationId = localStorage.getItem('activeConversationId');
    
    loadConversations().then((convs) => {
      if (savedConversationId && convs.find(c => c.sessionId === savedConversationId)) {
        // Load the saved conversation if it exists
        loadConversation(savedConversationId);
      } else if (convs.length > 0 && !currentConversationId) {
        // Otherwise load the first conversation
        loadConversation(convs[0].sessionId);
      }
    });
  }
}, [mounted]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      const data = await response.json();
      setConversations(data || []);
      
      // Return the conversations for use in the effect
      return data || [];
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
      return [];
    }
  };
  
  // Load conversations and set first one as active

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
      setCurrentStep(data.currentStep);
      setCurrentConversation(data);

      localStorage.setItem('activeConversationId', data.sessionId);

      // Set the initial message from the backend
      setMessages([
        {
          role: "assistant",
          content: data.message,
          step: data.currentStep,
          timestamp: new Date(),
        },
      ]);

      // Reset all state
      setStepData({});
      setSelectedHighlights([]);
      setUniqueDetail("");
      setUserInput("");
      setEditingMode(null);
      setEditContent("");
      setValidationError("");

      // Reload conversations to show the new one
      await loadConversations();
    } catch (error) {
      console.error("Error starting conversation:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "Sorry, there was an error starting the conversation. Please try again.",
          step: 1,
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
      setCurrentConversation(data);
      setCurrentStep(data.currentStep);
      setStepData(data.data || {});

      // Restore highlights and unique detail from conversation data
      if (data.data?.highlights && Array.isArray(data.data.highlights)) {
        setSelectedHighlights([...data.data.highlights]);
      } else {
        setSelectedHighlights([]);
      }

      if (data.data?.uniqueDetail) {
        setUniqueDetail(data.data.uniqueDetail);
      } else {
        setUniqueDetail("");
      }

      // Reset editing states
      setEditingMode(null);
      setEditContent("");
      setValidationError("");

      // Convert backend messages to frontend format
      const formattedMessages =
        data.messages?.map((msg) => ({
          role: msg.role,
          content: msg.content,
          step: msg.step,
          timestamp: new Date(msg.createdAt || Date.now()),
          data: msg.data,
          tokens: msg.tokens,
        })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
    setLoading(false);
  };

  // Enhanced step processing with better validation and state management
  const processStep = async (message, action = "continue", data = null) => {
    if (!currentConversationId) return;

    // Clear any validation errors
    setValidationError("");

    // Validate input based on current step
    if (!validateStepInput(currentStep, message, action, data)) {
      return; // Validation error will be set by validateStepInput
    }

    // Add user message to UI immediately (only for meaningful messages)
    if (
      message &&
      message !== "highlights_selected" &&
      message !== "approved" &&
      typeof message === "string" &&
      action === "continue"
    ) {
      const userMessage = {
        role: "user",
        content: message,
        step: currentStep,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setMsgLoading(true);
      setUserInput(""); // Clear input immediately
    }

    setLoading(true);

    try {
      const requestBody = {
        sessionId: currentConversationId,
        action,
      };

      // Handle different data scenarios
      if (data) {
        requestBody.data = data;
      } else if (
        message &&
        message !== "highlights_selected" &&
        message !== "approved"
      ) {
        requestBody.message = message;
      }

      console.log("Sending request:", requestBody);

      const response = await fetch(`${API_BASE}/conversations/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("Received response:", responseData);

      if (response.ok) {
        // Update current step properly
        setCurrentStep(responseData.currentStep);

        // Merge conversation data properly
        const newStepData = {
          ...stepData,
          ...responseData.conversationData,
          ...responseData,
        };
        setStepData(newStepData);

        // Update highlights state if returned from backend
        if (responseData.highlights && Array.isArray(responseData.highlights)) {
          setSelectedHighlights([...responseData.highlights]);
        }
        if (responseData.uniqueDetail) {
          setUniqueDetail(responseData.uniqueDetail);
        }

        // Add assistant response to messages
        const assistantMessage = {
          role: "assistant",
          content: responseData.message,
          step: responseData.currentStep,
          timestamp: new Date(),
          data: responseData,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        await loadConversations(); // Refresh conversation list
      } else {
        console.error("Step processing failed:", responseData);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              responseData.message ||
              "Sorry, there was an error processing your request. Please try again.",
            step: currentStep,
            timestamp: new Date(),
            error: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing step:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was a connection error. Please try again.",
          step: currentStep,
          timestamp: new Date(),
          error: true,
        },
      ]);
    }
    setLoading(false);
    setMsgLoading(false);
  };

  // NEW: Input validation function
  const validateStepInput = (step, message, action, data) => {
    switch (step) {
      case 1: // Transaction validation
        if (action === "continue" && message) {
          const lowerMessage = message.toLowerCase().trim();
          if (
            !lowerMessage.includes("sale") &&
            !lowerMessage.includes("rent") &&
            !lowerMessage.includes("verkoop") &&
            !lowerMessage.includes("huur")
          ) {
            setValidationError("Please reply with either 'sale' or 'rent'.");
            return false;
          }
        }
        break;
      case 2: // Property type validation
        if (action === "continue" && message) {
          const propertyTypes = [
            "apartment",
            "house",
            "studio",
            "villa",
            "townhouse",
            "condo",
            "flat",
          ];
          const lowerMessage = message.toLowerCase().trim();
          if (
            !propertyTypes.some((type) => lowerMessage.includes(type)) &&
            lowerMessage.length < 3
          ) {
            setValidationError(
              "Please specify a valid property type (e.g., apartment, house, studio, villa)."
            );
            return false;
          }
        }
        break;
      case 3: // Basic features validation
        if (action === "continue" && message && message.trim().length < 10) {
          setValidationError(
            "Please provide more detailed information about the property features."
          );
          return false;
        }
        break;
      case 4: // Highlights validation
        if (
          action === "highlights" &&
          (!data?.highlights || data.highlights.length === 0)
        ) {
          setValidationError("Please select at least one highlight.");
          return false;
        }
        break;
      case 5: // Target audience validation
        if (action === "continue" && message && message.trim().length < 3) {
          setValidationError("Please specify your target audience.");
          return false;
        }
        break;
    }
    return true;
  };

  // Enhanced highlights submission
  const handleHighlightsSubmit = () => {
    if (selectedHighlights.length === 0) {
      setValidationError("Please select at least one highlight");
      return;
    }

    const highlightsData = {
      highlights: [...selectedHighlights],
      uniqueDetail: uniqueDetail.trim(),
    };

    console.log("Submitting highlights:", highlightsData);
    processStep("highlights_selected", "highlights", highlightsData);
  };

  // NEW: Enhanced editing functions
  const startEditing = (mode, currentContent) => {
    setEditingMode(mode);
    setEditContent(
      typeof currentContent === "object"
        ? JSON.stringify(currentContent, null, 2)
        : currentContent
    );
  };

  const cancelEditing = () => {
    setEditingMode(null);
    setEditContent("");
  };

  const saveEditing = () => {
    if (!editContent.trim()) {
      setValidationError("Content cannot be empty.");
      return;
    }

    let parsedContent;
    try {
      // Try to parse as JSON first (for structured data like persona)
      if (editingMode === "persona") {
        parsedContent = JSON.parse(editContent);
      } else if (editingMode === "questions") {
        // For questions, expect an array of strings
        parsedContent = JSON.parse(editContent);
        if (!Array.isArray(parsedContent)) {
          throw new Error("Questions must be an array");
        }
      } else {
        parsedContent = editContent;
      }
    } catch (error) {
      if (editingMode === "persona") {
        setValidationError(
          "Invalid JSON format. Please check your formatting."
        );
        return;
      } else if (editingMode === "questions") {
        setValidationError(
          'Questions must be in JSON array format. Example: ["Question 1?", "Question 2?"]'
        );
        return;
      } else {
        parsedContent = editContent; // For plain text content
      }
    }

    // Send the edited content
    processStep(editContent, `update_${editingMode}`, {
      [editingMode]: parsedContent,
    });
    setEditingMode(null);
    setEditContent("");
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === "user";

    // Check if THIS specific message is being edited
    const isBeingEdited =
      !isUser &&
      message.step === 6 &&
      editingMode &&
      message.data &&
      ((editingMode === "persona" && message.data.persona) ||
        (editingMode === "questions" && message.data.questions) ||
        (editingMode === "answers" && message.data.answers));

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={` ${
            isBeingEdited ? "w-1/2" : "max-w-3xl"
          }  rounded-lg px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-[#00a8a8] to-[#1e40af] text-white"
              : message.error
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {!isUser &&
            message.data &&
            renderStepContent(message.data, message.step)}
          {!isUser && !message.data && (
            <ReactMarkdown className="whitespace-pre-wrap">
              {message.content}
            </ReactMarkdown>
          )}

          {isUser && (
            <ReactMarkdown className="whitespace-pre-wrap">
              {message.content === "generate final"
                ? "generate final listing"
                : message.content}
            </ReactMarkdown>
          )}
          <div
            className={`text-xs mt-2 ${
              isUser ? "text-white/70" : "text-gray-500"
            }`}
          >
            Step {message.step} • {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };
  const renderStepContent = (data, step) => {
    switch (step) {
      case 4:
        // Show highlights selection UI when highlights are present and not yet successful
        if (
          data.highlights &&
          Array.isArray(data.highlights) &&
          !data.success
        ) {
          return (
            <div className="space-y-4">
              <p className="font-medium">Select applicable highlights:</p>
              <div className="grid grid-cols-2 gap-2">
                {data.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedHighlights((prev) =>
                        prev.includes(highlight)
                          ? prev.filter((h) => h !== highlight)
                          : [...prev, highlight]
                      );
                    }}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                      selectedHighlights.includes(highlight)
                        ? "border-[#00a8a8] bg-gradient-to-r from-[#00a8a8]/10 to-[#1e40af]/10"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHighlights.includes(highlight)}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#00a8a8] border-gray-300 rounded focus:ring-[#00a8a8]"
                    />
                    <span className="capitalize">{highlight}</span>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={uniqueDetail}
                onChange={(e) => setUniqueDetail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] text-gray-900"
                placeholder="Unique detail (one sentence)"
              />
              {currentStep === 4 ? (
                <button
                  onClick={handleHighlightsSubmit}
                  disabled={loading || selectedHighlights.length === 0}
                  className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-50"
                >
                  {/* {loading ? "Processing..." : "Continue"} */}
                  Continue
                </button>
              ) : (
                ""
              )}
            </div>
          );
        }
        // Show success message when highlights are processed
        return <p className="whitespace-pre-wrap">{data.message}</p>;

      case 6:
        console.log("Rendering step 6 with data:", data);
        console.log("Substep:", data.substep);
        console.log("Questions:", data.questions);

        // Show persona with editing capability
        if (data.persona && (!data.substep || data.substep === "persona")) {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Generated Persona:</p>
                {!editingMode && (
                  <button
                    onClick={() => startEditing("persona", data.persona)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingMode === "persona" ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] text-sm font-mono"
                    placeholder="Edit the persona in JSON format..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEditing}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border text-sm">
                  {renderPersonaObject(data.persona)}
                </div>
              )}

              {editingMode !== "persona" && currentStep === 6 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => processStep("approved", "approve_persona")}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md"
                  >
                    {/* {loading ? "Processing..." : "Approve"} */}
                    Approve
                  </button>
                  <button
                    onClick={() => processStep("Please regenerate the persona")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          );
        }

        // Show questions with editing capability
        if (data.questions && data.substep === "questions") {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Generated Questions:</p>
                {!editingMode && (
                  <button
                    onClick={() => startEditing("questions", data.questions)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingMode === "questions" ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] text-sm font-mono"
                    placeholder="Edit the questions in JSON format..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEditing}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-lg border text-sm">
                  <div className="space-y-3">
                    {data.questions.map((question, index) => {
                      // Regex: check if question starts with "number." or "number)"
                      const alreadyNumbered = /^\s*\d+[\.\)]/.test(question);

                      return (
                        <div key={index} className="flex items-start space-x-2">
                          {!alreadyNumbered && (
                            <span className="text-[#00a8a8] font-medium text-sm mt-1">
                              {index + 1}.
                            </span>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {question}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {editingMode !== "questions" && currentStep === 6 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => processStep("approved", "approve_questions")}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md"
                  >
                    {/* {loading ? "Processing..." : "Approve"} */}
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      processStep("Please regenerate the questions")
                    }
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          );
        }

        // Show answers with editing capability
        if (data.answers && data.substep === "answers") {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Generated Answers:</p>
                {!editingMode && (
                  <button
                    onClick={() => startEditing("answers", data.answers)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingMode === "answers" ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] text-sm font-mono"
                    placeholder="Edit the answers in JSON format..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEditing}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-lg border text-sm">
                  <div className="space-y-4">
                    {data.answers.map((answer, index) => {
                      const question = data.questions?.[index] || "";

                      // check if question already starts with a number
                      const questionNumbered = /^\s*\d+[\.\)]/.test(question);
                      // check if answer already starts with a number
                      const answerNumbered = /^\s*\d+[\.\)]/.test(answer);

                      return (
                        <div key={index} className="space-y-2">
                          {/* Question */}
                          <div className="flex items-start space-x-2">
                            {!questionNumbered && (
                              <span className="text-[#00a8a8] font-medium text-sm mt-1 flex-shrink-0">
                                Q{index + 1}.
                              </span>
                            )}
                            <p className="text-gray-600 text-sm leading-relaxed font-medium">
                              {question}
                            </p>
                          </div>

                          {/* Answer */}
                          <div className="flex items-start space-x-2 ml-6">
                            <span className="text-purple-600 font-medium text-sm mt-1 flex-shrink-0">
                              A:
                            </span>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {!answerNumbered
                                ? `${index + 1}. ${answer}`
                                : answer}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {editingMode !== "answers" && currentStep === 6 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => processStep("approved", "approve_answers")}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md"
                  >
                    {/* {loading ? "Processing..." : "Approve"} */}
                    Approve
                  </button>
                  <button
                    onClick={() => processStep("Please regenerate the answers")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          );
        }

      case 8:
        if (data.finalListing) {
          return (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="font-medium text-lg">
                  Property Listing Complete! 🎉
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 text-sm ">
                <ReactMarkdown className="whitespace-pre-wrap text-gray-800">
                  {data.finalListing}
                </ReactMarkdown>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleCopy(data.finalListing)}
                  className={`flex items-center space-x-2 bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md ${
                    copied ? "opacity-80" : ""
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={startNewConversation}
                  className="bg-gradient-to-r from-[#ff9933] to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md"
                >
                  New Listing
                </button>
              </div>
            </div>
          );
        }
        break;
    }

    return (

      <ReactMarkdown className="whitespace-pre-wrap text-gray-800">
        {data.message || "Processing..."}

        </ReactMarkdown>
      // <p className="whitespace-pre-wrap"></p>
    );
  };

  const renderInputArea = () => {
    if (currentStep === 0 || currentStep === 8) return null;

    // Don't show input area during highlights selection (step 4)
    if (currentStep === 4) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.data?.highlights && !lastMessage?.data?.success) {
        return null;
      }
    }

    // Don't show input area during persona/Q&A interactions when not editing
    if (currentStep === 6) {
      const lastMessage = messages[messages.length - 1];
      if (
        (lastMessage?.data?.persona ||
          lastMessage?.data?.questions ||
          lastMessage?.data?.answers) &&
        !editingMode
      ) {
        return null;
      }
    }

    // Step 7 - Final generation button (but don't auto-trigger)
    if (currentStep === 7) {
      return (
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Ready to generate your final property listing?
            </p>
            <p className="text-xs text-gray-500">
              This will combine all your inputs into a professional listing.
            </p>
          </div>
          <button
            onClick={() => processStep("generate final")}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white py-4 px-6 rounded-lg font-medium disabled:opacity-50 transition-all shadow-md"
          >
            {loading
              ? "Generating Final Listing..."
              : "Generate Final Property Listing"}
          </button>
        </div>
      );
    }

    // Regular input for other steps
    return (
      <div className="p-3">
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{validationError}</p>
          </div>
        )}

        <div className="flex space-x-3">
          {currentStep === 3 ? (
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] resize-none shadow-sm"
              placeholder="Example: 85m², 3 rooms, 2 bedrooms, built 1995, balcony 8m², energy label B"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (userInput.trim()) processStep(userInput);
                }
              }}
            />
          ) : (
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a8a8] focus:border-[#00a8a8] shadow-sm"
              placeholder={getPlaceholderForStep(currentStep)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userInput.trim()) {
                  processStep(userInput);
                }
              }}
            />
          )}
          <button
            onClick={() => processStep(userInput)}
            disabled={loading || !userInput.trim()}
            className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium transition-all shadow-md"
          >
            {msgLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    );
  };

  // NEW: Dynamic placeholders based on step
  const getPlaceholderForStep = (step) => {
    switch (step) {
      case 1:
        return "Type 'sale' or 'rent'...";
      case 2:
        return "e.g., apartment, house, studio, villa...";
      case 5:
        return "e.g., first-time buyer, family, investor...";
      default:
        return "Type your answer...";
    }
  };

  const getConversationTitle = (conv) => {
    const data = conv.data || {};
    if (data.propertyType && data.transaction) {
      return (
        `${data.transaction} - ${data.propertyType}`.charAt(0).toUpperCase() +
        `${data.transaction} - ${data.propertyType}`.slice(1)
      );
    }
    return `Step ${conv.currentStep} - ${
      steps.find((s) => s.id === conv.currentStep)?.title || "New Chat"
    }`;
  };

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a8a8]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0  fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#fcfcfc] text-black transition-transform duration-300 ease-in-out flex flex-col shadow-xl`}
        >
          {/* Header */}
          <div className="p-6 border-b  border-blue-600/30">
            <div className="flex items-center justify-between">
              <WoningTovenaarLogo className="w-32 h-16" textSize="text-xl" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-blue-600/30 transition-colors"
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
              New Property Listing
            </button>
          </div>

          {/* Conversations List */}

          <div className="overflow-y-auto ">
            <div className="flex-1 ">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
                  Recent Conversations
                </h3>
                <div className="space-y-2">
                  {conversations?.map((conv) => (
                    <div
                      key={conv.sessionId}
                      onClick={() => loadConversation(conv.sessionId)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        currentConversationId === conv.sessionId
                          ? "bg-gradient-to-r from-[#00a8a8] to-[#1e40af] text-white shadow-md"
                          : "hover:bg-blue-800/30 hover:text-white text-gray-900"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getConversationTitle(conv)}
                          </p>
                          <p className="text-xs opacity-75 mt-1">
                            {conv.status} • Step {conv.currentStep}/8
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {currentStep > 0 && (
              <div className="p-4 border-t border-blue-600/30">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
                  Progress
                </h3>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-medium transition-colors ${
                          currentStep >= step.id
                            ? "bg-green-500 border-green-500 text-white"
                            : currentStep === step.id
                            ? "bg-gradient-to-r from-[#00a8a8] to-teal-600 border-[#00a8a8] text-white shadow-md"
                            : "bg-transparent border-blue-400 text-blue-300"
                        }`}
                      >
                        {currentStep >= step.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          currentStep >= step.id
                            ? "text-gray-900 font-medium"
                            : "text-blue-900"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

          <LogoutButton />
          <header
            className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 ${
              currentConversationId ? "py-3 px-6" : "p-2"
            }  shadow-sm`}
          >
            <div className="flex items-center justify-between">
              {/* Sidebar button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Title or Logo */}
              <div className="flex-1 text-center lg:text-left lg:ml-0 ml-12">
                {currentConversationId ? (
                  <h2 className="text-xl font-bold text-[#1e40af]">
                    {conversations.find(
                      (c) => c.sessionId === currentConversationId
                    )
                      ? getConversationTitle(
                          conversations.find(
                            (c) => c.sessionId === currentConversationId
                          )
                        )
                      : "Property Listing Chat"}
                  </h2>
                ) : (
                  <WoningTovenaarLogo
                    className="w-20 h-[60px]"
                    textSize="text-xl"
                  />
                )}
              </div>

              {/* Placeholder for spacing */}
            </div>

            {/* Step progress centered inside header */}
            {currentConversationId && (
              <div className="flex items-center   space-x-2">
                <div className="text-sm font-medium text-[#1e40af]">
                  Step {currentStep}/8
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}


        


          </header>

          {/* Chat Area */}
          <div className="flex-1 chat-container overflow-y-auto">
            {currentConversationId ? (
              <div className="mx-auto p-6">
                {messages.map((message, index) =>
                  renderMessage(message, index)
                )}
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
                <div className="text-center space-y-8 p-8">
                  <div className="w-32 h-32 mx-auto">
                    <WoningTovenaarLogo
                      className="w-32 h-32"
                      textSize="text-3xl"
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-[#1e40af] mb-4">
                      Welcome to WoningTovenaar 🏠
                    </h1>
                    <p className="text-xl text-gray-600 max-w-md mx-auto leading-relaxed">
                      Create professional property listings with AI-powered
                      assistance
                    </p>
                  </div>
                  <button
                    onClick={startNewConversation}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#00a8a8] to-[#1e40af] hover:from-[#008a8a] hover:to-[#1e40af]/90 text-white font-medium py-4 px-8 rounded-lg text-lg disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {loading ? "Starting..." : "Start New Property Listing"}
                  </button>
                  <div className="flex justify-center space-x-8 text-sm text-gray-500 mt-8">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Step-by-step guidance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-[#00a8a8]" />
                      <span>AI-powered content</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-[#ff9933]" />
                      <span>Professional results</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {renderInputArea()}
          <Footer />
        </main>
      </div>
    </div>
  );
}
