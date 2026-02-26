"use client";

import { useState, useRef, useEffect } from "react";

interface KitBotProps {
    repoName: string;
    username: string;
    currentFile?: string | null;
    fileContent?: string;
    repoContext?: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function KitBot({ repoName, username, currentFile, fileContent, repoContext }: KitBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm KitBot 🤖. I can help you understand your code, explain functions, find bugs, or answer questions about this repository. What would you like to know?",
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
            // Build context from current file/repo
            const context = {
                repo: `${username}/${repoName}`,
                currentFile: currentFile || "none",
                fileContent: currentFile && fileContent ? `\nCurrent file content:\n\`\`\`\n${fileContent.slice(0, 3000)}${fileContent.length > 3000 ? "... (truncated)" : ""}\n\`\`\`` : "",
                repoContext: repoContext || "",
            };

            // Call KitBot API endpoint
            const response = await fetch("/api/kitbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context,
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

    const suggestedQuestions = currentFile ? [
        "Explain this file",
        "What does this code do?",
        "Find potential bugs",
        "How can I improve this?",
    ] : [
        "What is this repo about?",
        "Show me the main files",
        "How do I get started?",
        "What tech stack is used?",
    ];

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-110 transition-all flex items-center justify-center group"
                >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-40 w-96 h-[500px] glass rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--kit-border)]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--kit-border)] bg-gradient-to-r from-orange-500/20 to-orange-600/20">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">KitBot</h3>
                                <p className="text-xs text-[var(--kit-text-muted)]">Code Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-[var(--kit-text-muted)] hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                        msg.role === "user"
                                            ? "bg-orange-600 text-white"
                                            : "bg-[var(--kit-surface-1)] text-[var(--kit-text)] border border-[var(--kit-border)]"
                                    }`}
                                >
                                    {msg.role === "assistant" && (
                                        <span className="text-xs text-orange-400 font-semibold block mb-1">KitBot</span>
                                    )}
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[var(--kit-surface-1)] border border-[var(--kit-border)] rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length <= 1 && (
                        <div className="px-4 py-2 border-t border-[var(--kit-border)]">
                            <p className="text-xs text-[var(--kit-text-muted)] mb-2">Suggested questions:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestedQuestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="text-xs px-2.5 py-1.5 rounded-full bg-[var(--kit-surface-1)] border border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white hover:border-orange-500/50 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--kit-border)]">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your code..."
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
