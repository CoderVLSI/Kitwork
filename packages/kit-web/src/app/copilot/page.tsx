"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Image from "next/image";
import Link from "next/link";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface RepoItem {
    _id: string;
    name: string;
    ownerUsername: string;
    description?: string;
    isPublic: boolean;
}

const MODELS = [
    { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash", description: "Fast & efficient" },
    { id: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro", description: "Most capable" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Balanced" },
];

export default function CopilotPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
    const [selectedModel, setSelectedModel] = useState(MODELS[0]);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<{ id: string; username: string } | null>(null);
    const [repoSearch, setRepoSearch] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    // Load user
    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    // Fetch user's repos
    const userRepos = useQuery(
        api.repos.listByUser,
        user ? { ownerUsername: user.username } : "skip"
    );

    // Close model menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const filteredRepos = (userRepos || []).filter((r: RepoItem) =>
        r.name.toLowerCase().includes(repoSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const apiKey = localStorage.getItem("kit_google_api_key") || "";

            const context: any = {
                repo: selectedRepo ? `${selectedRepo.ownerUsername}/${selectedRepo.name}` : "No repository selected",
                currentFile: "",
            };

            if (selectedRepo) {
                context.repoInfo = JSON.stringify({
                    description: selectedRepo.description || "",
                    isPublic: selectedRepo.isPublic,
                    defaultBranch: "main",
                });
            }

            const response = await fetch("/api/kitbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context,
                    apiKey,
                    model: selectedModel.id,
                    username: selectedRepo?.ownerUsername,
                    repoName: selectedRepo?.name,
                    userId: user?.id,
                }),
            });

            if (!response.ok) {
                throw new Error("KitBot is not available right now");
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${error.message}. Make sure the KitBot API is configured.`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
    };

    const isEmptyChat = messages.length === 0;

    return (
        <div className="min-h-screen pt-16 flex bg-[var(--kit-bg)]">
            {/* Left Sidebar */}
            <aside
                className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden border-r border-[var(--kit-border)] bg-[#0a0a12] flex flex-col h-[calc(100vh-64px)] sticky top-16`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-[var(--kit-border)] flex items-center justify-between">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-medium hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 w-full justify-center"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Repository Selector */}
                <div className="p-3 border-b border-[var(--kit-border)]">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--kit-text-muted)] font-semibold mb-2 px-1">
                        Repository Context
                    </div>
                    <div className="relative mb-2">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={repoSearch}
                            onChange={(e) => setRepoSearch(e.target.value)}
                            placeholder="Filter repos..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white text-xs placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                    </div>

                    {/* Selected Repo Badge */}
                    {selectedRepo && (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-2">
                            <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-xs text-orange-300 font-medium truncate">{selectedRepo.name}</span>
                            <button
                                onClick={() => setSelectedRepo(null)}
                                className="ml-auto text-orange-400/70 hover:text-orange-300 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Repo List */}
                <div className="flex-1 overflow-y-auto">
                    {!user ? (
                        <div className="p-4 text-center">
                            <p className="text-xs text-[var(--kit-text-muted)] mb-3">Sign in to see your repositories</p>
                            <Link href="/login" className="text-xs text-orange-400 hover:text-orange-300 transition-colors underline">
                                Sign In
                            </Link>
                        </div>
                    ) : filteredRepos.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-xs text-[var(--kit-text-muted)]">
                                {repoSearch ? "No matching repos" : "No repositories yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredRepos.map((repo: RepoItem) => (
                                <button
                                    key={repo._id}
                                    onClick={() => setSelectedRepo(repo)}
                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors ${selectedRepo?._id === repo._id ? "bg-orange-500/10 border-l-2 border-orange-500" : "border-l-2 border-transparent"
                                        }`}
                                >
                                    <svg className={`w-4 h-4 shrink-0 ${selectedRepo?._id === repo._id ? "text-orange-400" : "text-[var(--kit-text-muted)]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-sm truncate ${selectedRepo?._id === repo._id ? "text-orange-300 font-medium" : "text-[var(--kit-text)]"}`}>
                                            {repo.name}
                                        </div>
                                        {repo.description && (
                                            <div className="text-[10px] text-[var(--kit-text-muted)] truncate mt-0.5">
                                                {repo.description}
                                            </div>
                                        )}
                                    </div>
                                    {!repo.isPublic && (
                                        <svg className="w-3 h-3 text-yellow-500/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Toggle Sidebar Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed left-0 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-r-lg bg-[var(--kit-surface)] border border-l-0 border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white transition-colors"
                style={{ left: sidebarOpen ? "288px" : "0px", transition: "left 0.3s ease" }}
            >
                <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-[calc(100vh-64px)] relative">
                {/* Top Bar: Model Switcher */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--kit-border)] bg-[#0a0a12]/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Image src="/copilot-icon.png" alt="Copilot" width={20} height={20} className="opacity-80" />
                        <span className="text-sm font-medium text-white">KitBot</span>
                        {selectedRepo && (
                            <span className="text-xs text-[var(--kit-text-muted)] px-2 py-0.5 rounded-full bg-white/5 border border-[var(--kit-border)]">
                                {selectedRepo.ownerUsername}/{selectedRepo.name}
                            </span>
                        )}
                    </div>

                    {/* Model Switcher */}
                    <div className="relative" ref={modelMenuRef}>
                        <button
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--kit-border)] bg-[var(--kit-surface)] hover:bg-[var(--kit-surface)] hover:border-orange-500/30 text-sm transition-all"
                        >
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[var(--kit-text)]">{selectedModel.label}</span>
                            <svg className={`w-3.5 h-3.5 text-[var(--kit-text-muted)] transition-transform ${showModelMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showModelMenu && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#12121a] border border-[var(--kit-border)] shadow-2xl shadow-black/40 z-50 overflow-hidden">
                                <div className="p-2 border-b border-[var(--kit-border)]">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--kit-text-muted)] font-semibold px-2">Select Model</span>
                                </div>
                                {MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => { setSelectedModel(model); setShowModelMenu(false); }}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${selectedModel.id === model.id ? "bg-orange-500/10" : ""
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${selectedModel.id === model.id ? "bg-orange-400" : "bg-[var(--kit-border)]"}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm ${selectedModel.id === model.id ? "text-orange-300 font-medium" : "text-[var(--kit-text)]"}`}>
                                                {model.label}
                                            </div>
                                            <div className="text-[10px] text-[var(--kit-text-muted)]">{model.description}</div>
                                        </div>
                                        {selectedModel.id === model.id && (
                                            <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-6">
                    {isEmptyChat ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center h-full">
                            <Image src="/copilot-icon.png" alt="Copilot" width={56} height={56} className="drop-shadow-lg mb-6 opacity-80" />
                            <h2 className="text-xl font-semibold text-white mb-2">What can I help you build?</h2>
                            <p className="text-sm text-[var(--kit-text-muted)] mb-8 max-w-md text-center">
                                {selectedRepo
                                    ? `Ask me anything about ${selectedRepo.ownerUsername}/${selectedRepo.name}`
                                    : "Select a repository from the sidebar to get contextual help, or just ask me anything!"}
                            </p>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                                {[
                                    { icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", label: "Explain this repo", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300" },
                                    { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", label: "Help resolve an issue", color: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-300" },
                                    { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", label: "Write code", color: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-300" },
                                    { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Generate docs", color: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300" },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => setInput(action.label)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br ${action.color} border text-sm font-medium hover:scale-[1.02] transition-all`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                                        </svg>
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Messages */
                        <div className="max-w-3xl mx-auto py-6 space-y-6">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm ${msg.role === "user"
                                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                                            : "bg-gradient-to-br from-[#1a1a24] to-[#12121a] text-[var(--kit-text)] border border-[var(--kit-border)]"
                                            }`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Image src="/copilot-icon.png" alt="Copilot" width={16} height={16} />
                                                <span className="text-xs text-orange-400 font-semibold">KitBot</span>
                                                <span className="text-[10px] text-[var(--kit-text-muted)]">• {selectedModel.label}</span>
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
                                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Form at Bottom */}
                <div className="p-4 border-t border-[var(--kit-border)] bg-[#0a0a12]/80 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="relative w-full">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedRepo ? `Ask about ${selectedRepo.name}...` : "Ask anything..."}
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
                        <p className="text-center text-xs text-[var(--kit-text-muted)] mt-2">
                            KitBot uses AI ({selectedModel.label}). Check for mistakes.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
