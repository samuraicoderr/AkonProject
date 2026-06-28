"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2, RefreshCw, Leaf } from "lucide-react";
import { Button, Card } from "./ui";
import GroqService, { type ChatMessage } from "@/lib/api/services/GroqService";
import { useCropStore } from "@/lib/api/stores/cropStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { features, prediction } = useCropStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      chatMessages.push({ role: "user", content: input.trim() });

      const response = await GroqService.chat(chatMessages, {
        features,
        recommendation: prediction || undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestedQuestions = [
    "What's the best time to plant rice?",
    "How can I improve soil nitrogen naturally?",
    "What crops grow well with low rainfall?",
    "How do I prevent crop diseases?",
  ];

  return (
    <Card variant="elevated" className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#efe4e4]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#efe4e4] flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#8a6a6a]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2d2424]">AkonProject AI</h3>
            <p className="text-xs text-[#8c7b7b]">Your farming assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4">
        {messages.length === 0 ? (
          <EmptyState questions={suggestedQuestions} onSelect={setInput} />
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#efe4e4] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#8a6a6a]" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#f5f0ef] max-w-[80%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#8c7b7b]" />
                <span className="text-sm text-[#8c7b7b]">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-[#efe4e4]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about farming, crops, or soil..."
            className="flex-1 px-5 py-3.5 rounded-full border border-[#efe4e4] bg-[#fbf9f8] focus:outline-none focus:ring-2 focus:ring-[#bf9494]/30 focus:border-[#bf9494] text-sm transition-all"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!input.trim() || isLoading}
            className="!rounded-full !px-5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ----------------------------- MESSAGE BUBBLE ----------------------------- */

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-[#bf9494]" : "bg-[#efe4e4]"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[#8a6a6a]" />
        )}
      </div>
      <div
        className={`px-4 py-3 rounded-2xl max-w-[80%] ${
          isUser
            ? "bg-[#bf9494] text-white rounded-tr-sm"
            : "bg-[#f5f0ef] text-[#2d2424] rounded-tl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </motion.div>
  );
}

/* ----------------------------- EMPTY STATE ----------------------------- */

interface EmptyStateProps {
  questions: string[];
  onSelect: (question: string) => void;
}

function EmptyState({ questions, onSelect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-[#efe4e4] flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-[#bf9494]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2d2424] mb-2">
        How can I help you today?
      </h3>
      <p className="text-sm text-[#8c7b7b] mb-6 max-w-sm">
        Ask me anything about farming, crop selection, soil management, or get
        personalized advice based on your conditions.
      </p>
      <div className="space-y-2 w-full max-w-sm">
        {questions.map((question) => (
          <motion.button
            key={question}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(question)}
            className="w-full p-3.5 text-left text-sm rounded-2xl bg-[#f5f0ef] hover:bg-[#efe4e4] text-[#2d2424] transition-colors flex items-center gap-3"
          >
            <Leaf className="w-4 h-4 text-[#bf9494] flex-shrink-0" />
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
