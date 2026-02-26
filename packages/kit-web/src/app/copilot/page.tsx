"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function CopilotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm KitBot 🐱‍🏗️! Powered by AI, I can help you understand your code, answer questions, or explore repositories. What would you like to ask?",
        },
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const apiKey = localStorage.getItem("kit_google_api_key") || "";

            const response = await fetch("/api/kitbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context: { repoInfo: "General Kitwork Copilot Chat" },
                    apiKey,
                }),
            });

            if (!response.ok) {
                throw new Error("KitBot is not available right now");
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } catch (error: any) {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: `Sorry, I encountered an error: ${error.message}. Make sure the KitBot API is configured.`,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-16 flex flex-col bg-[var(--kit-bg)]">
            <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col pt-8 pb-32">
                <div className="flex justify-center mb-8">
                    <Image src="/copilot-icon.png" alt="Copilot" width={48} height={48} className="drop-shadow-lg" />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 space-y-6">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm ${msg.role === "user" ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20" : "bg-gradient-to-br from-[#1a1a24] to-[#12121a] text-[var(--kit-text)] border border-[var(--kit-border)]"}`}>
                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image src="/copilot-icon.png" alt="Copilot" width={16} height={16} />
                                        <span className="text-xs text-orange-400 font-semibold">KitBot</span>
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-[var(--kit-border)] rounded-2xl px-5 py-4 shadow-lg">
                                <div className="flex gap-1.5 items-center">
                                    <Image src="/copilot-icon.png" alt="Copilot" width={16} height={16} className="mr-2 opacity-70" />
                                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Form at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--kit-bg)] via-[var(--kit-bg)] to-transparent pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col gap-3 pointer-events-auto">
                    {messages.length <= 1 && (
                        <div className="flex justify-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--kit-border)] rounded-xl bg-[var(--kit-surface)] hover:bg-[var(--kit-surface-2)] text-sm transition-colors text-[var(--kit-text-muted)] hover:text-white" onClick={() => setInput("Explain this repo")}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Default
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--kit-border)] rounded-xl bg-[var(--kit-surface)] hover:bg-[var(--kit-surface-2)] text-sm transition-colors text-[var(--kit-text-muted)] hover:text-white" onClick={() => setInput("Help me resolve an issue")}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Create issue
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--kit-border)] rounded-xl bg-[var(--kit-surface)] hover:bg-[var(--kit-surface-2)] text-sm transition-colors text-[var(--kit-text-muted)] hover:text-white" onClick={() => setInput("Help me write code")}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                Write code
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="relative w-full shadow-2xl">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything"
                            className="w-full pl-6 pr-14 py-4 rounded-2xl bg-[var(--kit-surface)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all text-[15px] shadow-lg shadow-black/20"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[var(--kit-text-muted)] hover:text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                    <p className="text-center text-xs text-[var(--kit-text-muted)] mt-1">KitBot uses AI. Check for mistakes.</p>
                </div>
            </div>
        </div>
    );
}
