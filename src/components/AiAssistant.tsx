import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Loader2, MessageSquare, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am your WatchNow24 AI assistant. I can help you find channels, movies, or answer questions about your IPTV service. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-5) // Send last few messages for context
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.text || "I'm sorry, I couldn't process that request right now. Please try again later.";

      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: error.message || "Error connecting to AI service. Please ensure your API key is configured correctly in .env.local" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared. How else can I help you?" }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-600/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">WatchNow24 AI Assistant</h3>
            <p className="text-[10px] text-zinc-500 font-mono">POWERED BY GEMINI 1.5 FLASH</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                m.role === "user" ? "bg-zinc-800 border-zinc-700" : "bg-red-950/30 border-red-900/30"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-red-500" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-red-700 text-white rounded-tr-none"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"
              }`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about channels, movies, or support..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-700 text-white rounded-xl transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-[9px] text-zinc-600 text-center font-mono">
          AI may provide inaccurate information. Check important info.
        </p>
      </div>
    </div>
  );
}
