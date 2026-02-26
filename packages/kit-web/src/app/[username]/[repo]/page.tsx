"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
}

export default function RepoPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
    const rawParams = use(params);
    const username = decodeURIComponent(rawParams.username);
    const repoName = decodeURIComponent(rawParams.repo);
    const [tab, setTab] = useState<"code" | "commits">("code");
    const [currentPath, setCurrentPath] = useState("");
    const [viewingFile, setViewingFile] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // File creation state
    const [showFileModal, setShowFileModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [commitMessage, setCommitMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    // Convex queries and mutations
    const repoInfo = useQuery(api.repos.get, { ownerUsername: username, name: repoName });
    const commits = useQuery(api.repos.getCommits, { ownerUsername: username, repoName, branch: "main" });
    const tree = useQuery(api.repos.getTree, {
        ownerUsername: username,
        repoName,
        branch: repoInfo?.defaultBranch || "main",
        path: currentPath || undefined,
    });
    const fileData = useQuery(
        api.repos.getBlob,
        viewingFile
            ? { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main", path: viewingFile }
            : "skip"
    );

    const createFileMutation = useMutation(api.repos.createFile);

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

    const goToRoot = () => {
        setCurrentPath("");
        setViewingFile(null);
    };

    const openFileModal = () => {
        setShowFileModal(true);
        setFileName("");
        setFileContent("");
        setCommitMessage("");
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
                ownerUsername: username,
                repoName,
                branch: repoInfo?.defaultBranch || "main",
                path: fullPath,
                content: fileContent,
                message: commitMessage,
                author: user?.displayName || user?.username || "Anonymous",
            });
            closeFileModal();
            setCurrentPath(currentPath);
        } catch (err: any) {
            alert(err.message || "Failed to create file");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (repoInfo === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-[var(--kit-text-muted)]">Loading repository...</div>
            </div>
        );
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
                        {isOwner && (
                            <button
                                onClick={openFileModal}
                                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add file
                            </button>
                        )}
                    </div>
                    {repoInfo.description && <p className="text-sm text-[var(--kit-text-muted)] mt-1">{repoInfo.description}</p>}
                </div>

                {/* Clone URL */}
                <div className="glass rounded-xl p-3 mb-6 flex items-center gap-3">
                    <span className="text-xs text-[var(--kit-text-muted)]">Clone:</span>
                    <code className="text-xs code-font text-orange-300 flex-1">kit clone {username}/{repoName}</code>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-[var(--kit-border)]">
                    <button
                        onClick={() => setTab("code")}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "code" ? "border-orange-500 text-white" : "border-transparent text-[var(--kit-text-muted)] hover:text-white"}`}
                    >
                        📁 Code
                    </button>
                    <button
                        onClick={() => setTab("commits")}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "commits" ? "border-orange-500 text-white" : "border-transparent text-[var(--kit-text-muted)] hover:text-white"}`}
                    >
                        📝 Commits {commits && commits.length > 0 && <span className="ml-1 text-xs text-[var(--kit-text-muted)]">({commits.length})</span>}
                    </button>
                </div>

                {/* Code Tab */}
                {tab === "code" && (
                    <>
                        {viewingFile && fileData ? (
                            <div className="glass rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--kit-border)]">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewingFile(null)} className="text-xs text-orange-400 hover:text-orange-300">← Back</button>
                                        <span className="text-sm code-font text-white">{viewingFile}</span>
                                    </div>
                                </div>
                                <pre className="p-6 text-sm code-font text-[var(--kit-text)] overflow-x-auto whitespace-pre leading-relaxed">{fileData.content}</pre>
                            </div>
                        ) : (
                            <div className="glass rounded-xl overflow-hidden">
                                {currentPath && (
                                    <div className="flex items-center gap-1 px-4 py-3 border-b border-[var(--kit-border)] text-sm">
                                        <button onClick={goToRoot} className="text-orange-400 hover:text-orange-300">{repoName}</button>
                                        {currentPath.split("/").map((part, i, arr) => (
                                            <span key={i} className="flex items-center gap-1">
                                                <span className="text-[var(--kit-text-muted)]">/</span>
                                                <button
                                                    onClick={() => setCurrentPath(arr.slice(0, i + 1).join("/"))}
                                                    className={i === arr.length - 1 ? "text-white font-medium" : "text-orange-400 hover:text-orange-300"}
                                                >
                                                    {part}
                                                </button>
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
                                            <button
                                                onClick={openFileModal}
                                                className="mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all"
                                            >
                                                + Add your first file
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    [...tree.entries]
                                        .sort((a, b) => {
                                            if (a.type === "tree" && b.type !== "tree") return -1;
                                            if (a.type !== "tree" && b.type === "tree") return 1;
                                            return a.name.localeCompare(b.name);
                                        })
                                        .map((entry) => (
                                            <button
                                                key={entry.name}
                                                onClick={() => handleEntryClick(entry)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--kit-surface-2)] transition-colors border-b border-[var(--kit-border)] last:border-b-0"
                                            >
                                                <span>{entry.type === "tree" ? "📁" : "📄"}</span>
                                                <span className={entry.type === "tree" ? "text-orange-400 font-medium" : "text-white"}>{entry.name}</span>
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
                        ) : (
                            commits.map((c) => (
                                <div key={c.hash} className="glass rounded-xl p-4 hover:border-orange-500/30 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white mb-1">{c.message}</p>
                                            <p className="text-xs text-[var(--kit-text-muted)]">
                                                {c.author} committed {formatDate(c.timestamp)}
                                            </p>
                                        </div>
                                        <code className="text-xs code-font text-orange-400 bg-orange-400/10 px-2 py-1 rounded">{c.hash.slice(0, 8)}</code>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add File Modal */}
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
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Name</label>
                                <div className="flex items-center gap-2">
                                    {currentPath && (
                                        <span className="text-sm text-[var(--kit-text-muted)] code-font">{currentPath}/</span>
                                    )}
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font"
                                        placeholder="filename.txt"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Content</label>
                                <textarea
                                    value={fileContent}
                                    onChange={(e) => setFileContent(e.target.value)}
                                    className="w-full h-64 px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font text-sm resize-none"
                                    placeholder="// Write your code here..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Commit message</label>
                                <input
                                    type="text"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                    placeholder="Add a new file"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button
                                onClick={submitFile}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Committing..." : "Commit new file"}
                            </button>
                            <button
                                onClick={closeFileModal}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
