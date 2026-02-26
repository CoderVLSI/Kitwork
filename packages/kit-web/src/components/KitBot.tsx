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
            content: "Hi! I'm KitBot 🐱‍🏗️! Powered by Google Gemini 3 Flash Preview, I can help you understand your code, explain functions, find bugs, or answer questions about this repository. What would you like to build today?",
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
                    className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-500 to-orange-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-orange-500/50 hover:scale-110 transition-all flex items-center justify-center group border-2 border-white/20 animate-pulse-slow"
                >
                    <div className="text-3xl group-hover:animate-bounce">🐱‍🏗️</div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-[#0a0a0f]"></span>
                    </span>
                    <span className="absolute -bottom-1 -left-1 text-lg">🔧</span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-40 w-96 h-[540px] glass rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-gradient-to-r from-blue-400/50 to-orange-400/50 bg-gradient-to-br from-[#0a0a0f] to-[#0f0a0a]">
                    {/* Header with mascot theme */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--kit-border)] bg-gradient-to-r from-blue-500/30 via-orange-500/20 to-blue-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-orange-500 flex items-center justify-center text-2xl border-2 border-white/30 shadow-lg animate-pulse-slow">
                                🐱‍🏗️
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    KitBot
                                    <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500/30 to-blue-500/30 text-orange-300 text-[10px] font-semibold border border-orange-400/30">AI</span>
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-[var(--kit-text-muted)] flex items-center gap-1">
                                        Ready to help code! <span className="text-orange-400">⚡</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-[var(--kit-text-muted)] hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-500/5 to-orange-500/5">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                                            : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-[var(--kit-text)] border border-blue-400/30"
                                    }`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-xs">🐱‍🏗️</span>
                                            <span className="text-xs text-blue-400 font-semibold">KitBot</span>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 rounded-2xl px-4 py-3 shadow-lg">
                                    <div className="flex gap-1 items-center">
                                        <span className="text-xs mr-2">🐱‍🏗️</span>
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "100ms" }}></span>
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length <= 1 && (
                        <div className="px-4 py-3 border-t border-[var(--kit-border)] bg-gradient-to-r from-blue-500/10 to-orange-500/10">
                            <p className="text-xs text-[var(--kit-text-muted)] mb-2 flex items-center gap-1.5">
                                <span>🐱‍🏗️</span> Suggested questions:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestedQuestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-400/30 text-[var(--kit-text-muted)] hover:text-white hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--kit-border)] bg-gradient-to-r from-blue-500/5 to-orange-500/5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your code..."
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-blue-400/30 text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
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
