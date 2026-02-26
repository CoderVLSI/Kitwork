"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
}

// Auto-detect language from file extension
function detectLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const langMap: Record<string, string> = {
        js: "JavaScript", jsx: "JavaScript (JSX)", ts: "TypeScript", tsx: "TypeScript (TSX)",
        py: "Python", rb: "Ruby", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin",
        cpp: "C++", c: "C", h: "C Header", cs: "C#", swift: "Swift", php: "PHP",
        html: "HTML", css: "CSS", scss: "SCSS", less: "LESS",
        json: "JSON", yaml: "YAML", yml: "YAML", toml: "TOML", xml: "XML",
        md: "Markdown", txt: "Plain Text", sh: "Shell", bash: "Bash",
        sql: "SQL", graphql: "GraphQL", dockerfile: "Dockerfile",
        gitignore: "Git Ignore", env: "Environment", lock: "Lock File",
    };
    return langMap[ext] || "Plain Text";
}

// Get file icon based on extension
function getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const iconMap: Record<string, string> = {
        js: "🟨", jsx: "⚛️", ts: "🔷", tsx: "⚛️",
        py: "🐍", rb: "💎", go: "🐹", rs: "🦀",
        html: "🌐", css: "🎨", json: "📋", md: "📝",
        sh: "🖥️", sql: "🗃️", jpg: "🖼️", png: "🖼️",
        svg: "🎭", gif: "🎞️",
    };
    return iconMap[ext] || "📄";
}

// Spark IDs (ASCII-safe for Convex) → display emoji
const SPARK_MAP: Record<string, string> = {
    bolt: "⚡", fire: "🔥", rocket: "🚀", gem: "💎", target: "🎯",
};
const SPARK_IDS = Object.keys(SPARK_MAP);

export default function RepoPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
    const rawParams = use(params);
    const username = decodeURIComponent(rawParams.username);
    const repoName = decodeURIComponent(rawParams.repo);
    const [tab, setTab] = useState<"code" | "commits" | "threads">("code");
    const [currentPath, setCurrentPath] = useState("");
    const [viewingFile, setViewingFile] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // File creation state
    const [showFileModal, setShowFileModal] = useState(false);
    const [fileMode, setFileMode] = useState<"write" | "upload">("write");
    const [fileName, setFileName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [commitMessage, setCommitMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [detectedLang, setDetectedLang] = useState("Plain Text");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Thread state
    const [showThreadModal, setShowThreadModal] = useState(false);
    const [threadTitle, setThreadTitle] = useState("");
    const [threadBody, setThreadBody] = useState("");

    // Spark picker
    const [showSparkPicker, setShowSparkPicker] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    // Auto-detect language when filename changes
    useEffect(() => {
        if (fileName) setDetectedLang(detectLanguage(fileName));
    }, [fileName]);

    // Convex queries
    const repoInfo = useQuery(api.repos.get, { ownerUsername: username, name: repoName });
    const commits = useQuery(api.repos.getCommits, { ownerUsername: username, repoName, branch: "main" });
    const tree = useQuery(api.repos.getTree, {
        ownerUsername: username, repoName,
        branch: repoInfo?.defaultBranch || "main",
        path: currentPath || undefined,
    });
    const fileData = useQuery(
        api.repos.getBlob,
        viewingFile ? { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main", path: viewingFile } : "skip"
    );

    // Sparks
    const sparkData = useQuery(api.sparks.getByRepo, repoInfo ? { repoId: repoInfo._id } : "skip");
    const userSpark = useQuery(
        api.sparks.getUserSpark,
        user && repoInfo ? { userId: user.id as Id<"users">, repoId: repoInfo._id } : "skip"
    );
    const toggleSpark = useMutation(api.sparks.toggle);

    // Threads
    const threads = useQuery(api.threads.getByRepo, repoInfo ? { repoId: repoInfo._id } : "skip");
    const createThread = useMutation(api.threads.create);

    const createFileMutation = useMutation(api.repos.createFile);

    // File upload handler
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setCommitMessage(`Add ${file.name}`);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            setFileContent(content);
        };
        reader.readAsText(file);
    }, []);

    // Drop zone handler
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;

        setFileName(file.name);
        setFileMode("upload");
        setCommitMessage(`Add ${file.name}`);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            setFileContent(content);
        };
        reader.readAsText(file);
    }, []);

    const handleEntryClick = (entry: { type: string; name: string }) => {
        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        if (entry.type === "tree") {
            setCurrentPath(newPath);
            setViewingFile(null);
        } else {
            setViewingFile(newPath);
        }
    };

    const navigateUp = () => {
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        setCurrentPath(parts.join("/"));
        setViewingFile(null);
    };

    const goToRoot = () => { setCurrentPath(""); setViewingFile(null); };

    const openFileModal = () => {
        setShowFileModal(true);
        setFileMode("write");
        setFileName("");
        setFileContent("");
        setCommitMessage("");
        setDetectedLang("Plain Text");
    };

    const closeFileModal = () => {
        setShowFileModal(false);
        setFileName("");
        setFileContent("");
        setCommitMessage("");
    };

    const submitFile = async () => {
        if (!fileName.trim() || !fileContent || !commitMessage.trim()) {
            alert("Please fill in all fields");
            return;
        }
        setIsSubmitting(true);
        try {
            const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
            await createFileMutation({
                ownerUsername: username, repoName,
                branch: repoInfo?.defaultBranch || "main",
                path: fullPath, content: fileContent,
                message: commitMessage,
                author: user?.displayName || user?.username || "Anonymous",
            });
            closeFileModal();
        } catch (err: any) {
            alert(err.message || "Failed to create file");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSpark = async (emoji: string) => {
        if (!user || !repoInfo) return;
        await toggleSpark({ userId: user.id as Id<"users">, repoId: repoInfo._id, emoji });
        setShowSparkPicker(false);
    };

    const submitThread = async () => {
        if (!threadTitle.trim() || !threadBody.trim() || !user || !repoInfo) return;
        await createThread({
            repoId: repoInfo._id,
            authorId: user.id as Id<"users">,
            authorUsername: user.username,
            title: threadTitle,
            body: threadBody,
        });
        setShowThreadModal(false);
        setThreadTitle("");
        setThreadBody("");
    };

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const formatTimeAgo = (ts: number) => {
        const seconds = Math.floor((Date.now() - ts) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (repoInfo === undefined) {
        return (<div className="min-h-screen flex items-center justify-center pt-16"><div className="text-[var(--kit-text-muted)]">Loading repository...</div></div>);
    }
    if (repoInfo === null) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-white mb-2">Repository not found</h2>
                    <p className="text-sm text-[var(--kit-text-muted)]">{username}/{repoName} doesn&apos;t exist.</p>
                </div>
            </div>
        );
    }

    const isOwner = user?.username === username;

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Repo Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[var(--kit-text-muted)] mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <Link href={`/${username}`} className="hover:text-orange-400 transition-colors">{username}</Link>
                            <span>/</span>
                            <span className="text-white font-semibold">{repoName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ml-2 ${repoInfo.isPublic ? "border-[var(--kit-border)] text-[var(--kit-text-muted)]" : "border-yellow-500/30 text-yellow-400"}`}>
                                {repoInfo.isPublic ? "Public" : "Private"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Spark Button */}
                            <div className="relative">
                                <button
                                    onClick={() => user ? setShowSparkPicker(!showSparkPicker) : alert("Sign in to spark!")}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${userSpark ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "glass text-[var(--kit-text-muted)] hover:text-white"}`}
                                >
                                    {userSpark ? SPARK_MAP[userSpark.emoji] || "⚡" : "⚡"}
                                    <span>{sparkData?.total || 0}</span>
                                </button>
                                {showSparkPicker && (
                                    <div className="absolute top-full right-0 mt-2 glass rounded-xl p-2 flex gap-1 z-50 shadow-xl shadow-black/50">
                                        {SPARK_IDS.map(id => (
                                            <button
                                                key={id}
                                                onClick={() => handleSpark(id)}
                                                className={`w-9 h-9 rounded-lg text-lg hover:bg-orange-500/20 transition-all flex items-center justify-center ${userSpark?.emoji === id ? "bg-orange-500/30 ring-1 ring-orange-400" : ""}`}
                                            >
                                                {SPARK_MAP[id]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <button onClick={openFileModal} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add file
                                </button>
                            )}
                        </div>
                    </div>
                    {repoInfo.description && <p className="text-sm text-[var(--kit-text-muted)] mt-1">{repoInfo.description}</p>}

                    {/* Spark breakdown */}
                    {sparkData && sparkData.total > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            {sparkData.counts.map((c: { id: string; count: number }) => (
                                <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--kit-text-muted)]">{SPARK_MAP[c.id] || c.id} {c.count}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clone URL */}
                <div className="glass rounded-xl p-3 mb-6 flex items-center gap-3">
                    <span className="text-xs text-[var(--kit-text-muted)]">Clone:</span>
                    <code className="text-xs code-font text-orange-300 flex-1">kit clone {username}/{repoName}</code>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-[var(--kit-border)]">
                    {(["code", "commits", "threads"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-orange-500 text-white" : "border-transparent text-[var(--kit-text-muted)] hover:text-white"}`}
                        >
                            {t === "code" ? "📁 Code" : t === "commits" ? `📝 Commits${commits && commits.length > 0 ? ` (${commits.length})` : ""}` : `🧵 Threads${threads && threads.length > 0 ? ` (${threads.length})` : ""}`}
                        </button>
                    ))}
                </div>

                {/* Code Tab */}
                {tab === "code" && (
                    <>
                        {viewingFile && fileData ? (
                            <div className="glass rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--kit-border)]">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewingFile(null)} className="text-xs text-orange-400 hover:text-orange-300">← Back</button>
                                        <span className="text-sm code-font text-white">{getFileIcon(viewingFile)} {viewingFile}</span>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{detectLanguage(viewingFile)}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <tbody>
                                            {fileData.content.split("\n").map((line, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02]">
                                                    <td className="px-4 py-0 text-right select-none text-xs code-font text-[var(--kit-text-muted)]/40 w-12">{i + 1}</td>
                                                    <td className="px-4 py-0"><pre className="text-sm code-font text-[var(--kit-text)] whitespace-pre">{line}</pre></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="glass rounded-xl overflow-hidden">
                                {currentPath && (
                                    <div className="flex items-center gap-1 px-4 py-3 border-b border-[var(--kit-border)] text-sm">
                                        <button onClick={goToRoot} className="text-orange-400 hover:text-orange-300">{repoName}</button>
                                        {currentPath.split("/").map((part, i, arr) => (
                                            <span key={i} className="flex items-center gap-1">
                                                <span className="text-[var(--kit-text-muted)]">/</span>
                                                <button onClick={() => setCurrentPath(arr.slice(0, i + 1).join("/"))}
                                                    className={i === arr.length - 1 ? "text-white font-medium" : "text-orange-400 hover:text-orange-300"}>{part}</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {currentPath && (
                                    <button onClick={navigateUp} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--kit-text-muted)] hover:bg-[var(--kit-surface-2)] transition-colors border-b border-[var(--kit-border)]">
                                        <span>📂</span> ..
                                    </button>
                                )}
                                {tree === undefined ? (
                                    <div className="p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading...</div>
                                ) : !tree.entries || tree.entries.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="text-3xl mb-3">📭</div>
                                        <p className="text-sm text-[var(--kit-text-muted)]">
                                            {currentPath ? "This directory is empty." : "This repository is empty. Add a file to get started!"}
                                        </p>
                                        {isOwner && !currentPath && (
                                            <button onClick={openFileModal} className="mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">
                                                + Add your first file
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    [...tree.entries].sort((a, b) => {
                                        if (a.type === "tree" && b.type !== "tree") return -1;
                                        if (a.type !== "tree" && b.type === "tree") return 1;
                                        return a.name.localeCompare(b.name);
                                    }).map((entry) => (
                                        <button key={entry.name} onClick={() => handleEntryClick(entry)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--kit-surface-2)] transition-colors border-b border-[var(--kit-border)] last:border-b-0">
                                            <span>{entry.type === "tree" ? "📁" : getFileIcon(entry.name)}</span>
                                            <span className={entry.type === "tree" ? "text-orange-400 font-medium" : "text-white"}>{entry.name}</span>
                                            <span className="ml-auto text-xs text-[var(--kit-text-muted)]">{entry.type === "blob" ? detectLanguage(entry.name) : ""}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Commits Tab */}
                {tab === "commits" && (
                    <div className="space-y-2">
                        {commits === undefined ? (
                            <div className="glass rounded-xl p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading commits...</div>
                        ) : commits.length === 0 ? (
                            <div className="glass rounded-xl p-12 text-center">
                                <div className="text-3xl mb-3">📝</div>
                                <p className="text-sm text-[var(--kit-text-muted)]">No commits yet.</p>
                            </div>
                        ) : commits.map((c) => (
                            <div key={c.hash} className="glass rounded-xl p-4 hover:border-orange-500/30 transition-all">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white mb-1">{c.message}</p>
                                        <p className="text-xs text-[var(--kit-text-muted)]">{c.author} committed {formatDate(c.timestamp)}</p>
                                    </div>
                                    <code className="text-xs code-font text-orange-400 bg-orange-400/10 px-2 py-1 rounded">{c.hash.slice(0, 8)}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Threads Tab */}
                {tab === "threads" && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-[var(--kit-text-muted)]">
                                {threads ? `${threads.length} thread${threads.length !== 1 ? "s" : ""}` : "Loading..."}
                            </h3>
                            {user && (
                                <button onClick={() => setShowThreadModal(true)} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">
                                    + New Thread
                                </button>
                            )}
                        </div>

                        {threads === undefined ? (
                            <div className="glass rounded-xl p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading threads...</div>
                        ) : threads.length === 0 ? (
                            <div className="glass rounded-xl p-12 text-center">
                                <div className="text-3xl mb-3">🧵</div>
                                <h3 className="text-lg font-semibold text-white mb-2">No threads yet</h3>
                                <p className="text-sm text-[var(--kit-text-muted)] mb-4">Start a discussion about this project!</p>
                                {user && (
                                    <button onClick={() => setShowThreadModal(true)} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">
                                        Start a Thread
                                    </button>
                                )}
                            </div>
                        ) : threads.map((thread) => (
                            <div key={thread._id} className="glass rounded-xl p-5 hover:border-orange-500/30 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${thread.status === "open" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-purple-500/20 text-purple-400 border border-purple-500/30"}`}>
                                                {thread.status === "open" ? "● Open" : "✓ Resolved"}
                                            </span>
                                            <h4 className="text-sm font-semibold text-white">{thread.title}</h4>
                                        </div>
                                        <p className="text-xs text-[var(--kit-text-muted)] line-clamp-2 mb-2">{thread.body}</p>
                                        <div className="flex items-center gap-3 text-xs text-[var(--kit-text-muted)]">
                                            <span>by <span className="text-orange-400">{thread.authorUsername}</span></span>
                                            <span>{formatTimeAgo(thread.timestamp)}</span>
                                            {(thread.replyCount || 0) > 0 && <span>💬 {thread.replyCount} replies</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Add File Modal */}
            {showFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeFileModal}>
                    <div className="glass rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kit-border)]">
                            <h2 className="text-lg font-bold text-white">Create new file</h2>
                            <button onClick={closeFileModal} className="text-[var(--kit-text-muted)] hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Mode toggle: Write / Upload */}
                            <div className="flex rounded-lg overflow-hidden border border-[var(--kit-border)]">
                                <button onClick={() => setFileMode("write")}
                                    className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${fileMode === "write" ? "bg-orange-600 text-white" : "bg-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>
                                    ✏️ Write
                                </button>
                                <button onClick={() => setFileMode("upload")}
                                    className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${fileMode === "upload" ? "bg-orange-600 text-white" : "bg-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>
                                    📤 Upload
                                </button>
                            </div>

                            {/* File name */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)]">File name</label>
                                    {fileName && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{detectedLang}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentPath && (
                                        <span className="text-sm text-[var(--kit-text-muted)] code-font">{currentPath}/</span>
                                    )}
                                    <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font"
                                        placeholder="filename.txt" autoFocus />
                                </div>
                            </div>

                            {/* Content area */}
                            {fileMode === "write" ? (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Content</label>
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-10 bg-[var(--kit-bg)] border-r border-[var(--kit-border)] rounded-l-lg flex flex-col items-end pt-3 pr-2 text-[10px] text-[var(--kit-text-muted)]/30 code-font overflow-hidden select-none">
                                            {fileContent.split("\n").map((_, i) => (
                                                <div key={i} className="leading-5">{i + 1}</div>
                                            ))}
                                        </div>
                                        <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)}
                                            className="w-full h-64 pl-14 pr-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font text-sm resize-none leading-5"
                                            placeholder="// Start typing..." />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Upload file</label>
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-[var(--kit-border)] rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50 transition-all group"
                                    >
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                                        {fileContent ? (
                                            <div>
                                                <div className="text-2xl mb-2">{getFileIcon(fileName)}</div>
                                                <p className="text-sm font-medium text-white mb-1">{fileName}</p>
                                                <p className="text-xs text-[var(--kit-text-muted)]">{detectedLang} • {fileContent.length} characters</p>
                                                <p className="text-xs text-orange-400 mt-2">Click to choose a different file</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📤</div>
                                                <p className="text-sm text-white mb-1">Drop a file here or click to browse</p>
                                                <p className="text-xs text-[var(--kit-text-muted)]">Supports text files, code, configs, docs</p>
                                            </div>
                                        )}
                                    </div>
                                    {fileContent && (
                                        <div className="mt-3 glass rounded-lg p-3 max-h-32 overflow-auto">
                                            <p className="text-xs text-[var(--kit-text-muted)] mb-1">Preview:</p>
                                            <pre className="text-xs code-font text-white/70 whitespace-pre-wrap">{fileContent.slice(0, 500)}{fileContent.length > 500 ? "..." : ""}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Commit message */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Commit message</label>
                                <input type="text" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                    placeholder={`Add ${fileName || "new file"}`} />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button onClick={submitFile} disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? "Committing..." : "Commit new file"}
                            </button>
                            <button onClick={closeFileModal} disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Thread Modal */}
            {showThreadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowThreadModal(false)}>
                    <div className="glass rounded-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kit-border)]">
                            <h2 className="text-lg font-bold text-white">🧵 New Thread</h2>
                            <button onClick={() => setShowThreadModal(false)} className="text-[var(--kit-text-muted)] hover:text-white">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Title</label>
                                <input type="text" value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                    placeholder="What's on your mind?" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Body</label>
                                <textarea value={threadBody} onChange={(e) => setThreadBody(e.target.value)}
                                    className="w-full h-32 px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors text-sm resize-none"
                                    placeholder="Describe your question, idea, or feedback..." />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button onClick={submitThread} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all">
                                Post Thread
                            </button>
                            <button onClick={() => setShowThreadModal(false)} className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
