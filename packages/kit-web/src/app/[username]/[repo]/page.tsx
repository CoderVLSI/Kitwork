"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import Markdown from "@/components/Markdown";
import KitBot from "@/components/KitBot";

interface User { id: string; username: string; email: string; displayName: string; }

function detectLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const m: Record<string, string> = {
        js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX", py: "Python",
        rb: "Ruby", go: "Go", rs: "Rust", java: "Java", kt: "Kotlin",
        cpp: "C++", c: "C", h: "C Header", cs: "C#", swift: "Swift", php: "PHP",
        html: "HTML", css: "CSS", scss: "SCSS", json: "JSON", yaml: "YAML",
        yml: "YAML", toml: "TOML", xml: "XML", md: "Markdown", txt: "Text",
        sh: "Shell", sql: "SQL", dockerfile: "Dockerfile",
    };
    return m[ext] || "Plain Text";
}

function getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const m: Record<string, string> = {
        js: "🟨", jsx: "⚛️", ts: "🔷", tsx: "⚛️", py: "🐍", rb: "💎",
        go: "🐹", rs: "🦀", html: "🌐", css: "🎨", json: "📋", md: "📝",
        sh: "🖥️", sql: "🗃️", jpg: "🖼️", png: "🖼️", svg: "🎭",
    };
    return m[ext] || "📄";
}

const SPARK_MAP: Record<string, string> = { bolt: "⚡", fire: "🔥", rocket: "🚀", gem: "💎", target: "🎯" };
const SPARK_IDS = Object.keys(SPARK_MAP);

export default function RepoPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
    const rawParams = use(params);
    const username = decodeURIComponent(rawParams.username);
    const repoName = decodeURIComponent(rawParams.repo);
    const [tab, setTab] = useState<"code" | "commits" | "threads" | "patches">("code");
    const [currentPath, setCurrentPath] = useState("");
    const [viewingFile, setViewingFile] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const [showFileModal, setShowFileModal] = useState(false);
    const [fileMode, setFileMode] = useState<"write" | "upload">("write");
    const [fileName, setFileName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [commitMessage, setCommitMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [detectedLang, setDetectedLang] = useState("Plain Text");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showThreadModal, setShowThreadModal] = useState(false);
    const [threadTitle, setThreadTitle] = useState("");
    const [threadBody, setThreadBody] = useState("");
    const [showSparkPicker, setShowSparkPicker] = useState(false);

    const [showPatchModal, setShowPatchModal] = useState(false);
    const [patchTitle, setPatchTitle] = useState("");
    const [patchDesc, setPatchDesc] = useState("");
    const [patchFilter, setPatchFilter] = useState<"open" | "merged" | "closed" | "all">("open");

    useEffect(() => { const s = localStorage.getItem("kit_user"); if (s) setUser(JSON.parse(s)); }, []);
    useEffect(() => { if (fileName) setDetectedLang(detectLanguage(fileName)); }, [fileName]);

    const repoInfo = useQuery(api.repos.get, { ownerUsername: username, name: repoName });
    const commits = useQuery(api.repos.getCommits, { ownerUsername: username, repoName, branch: "main" });
    const tree = useQuery(api.repos.getTree, { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main", path: currentPath || undefined });
    const fileData = useQuery(api.repos.getBlob, viewingFile ? { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main", path: viewingFile } : "skip");
    const readme = useQuery(api.repos.getREADME, { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main" });
    const repoStats = useQuery(api.repos.getStats, { ownerUsername: username, repoName });
    const fileCommits = useQuery(api.repos.getFileCommits, { ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main" });

    const sparkData = useQuery(api.sparks.getByRepo, repoInfo ? { repoId: repoInfo._id } : "skip");
    const userSpark = useQuery(api.sparks.getUserSpark, user && repoInfo ? { userId: user.id as Id<"users">, repoId: repoInfo._id } : "skip");
    const toggleSpark = useMutation(api.sparks.toggle);

    const threads = useQuery(api.threads.getByRepo, repoInfo ? { repoId: repoInfo._id } : "skip");
    const createThread = useMutation(api.threads.create);

    const patches = useQuery(api.patches.getByRepo, repoInfo ? { repoId: repoInfo._id } : "skip");
    const createPatch = useMutation(api.patches.create);
    const mergePatch = useMutation(api.patches.merge);
    const closePatch = useMutation(api.patches.close);

    const remixCount = useQuery(api.repos.getRemixCount, repoInfo ? { repoId: repoInfo._id } : "skip");
    const remixMutation = useMutation(api.repos.remix);
    const createFileMutation = useMutation(api.repos.createFile);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setFileName(file.name); setCommitMessage(`Add ${file.name}`);
        const reader = new FileReader();
        reader.onload = (ev) => setFileContent(ev.target?.result as string);
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); const file = e.dataTransfer.files[0]; if (!file) return;
        setFileName(file.name); setFileMode("upload"); setCommitMessage(`Add ${file.name}`);
        const reader = new FileReader();
        reader.onload = (ev) => setFileContent(ev.target?.result as string);
        reader.readAsText(file);
    }, []);

    const handleEntryClick = (entry: { type: string; name: string }) => {
        const p = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        entry.type === "tree" ? (setCurrentPath(p), setViewingFile(null)) : setViewingFile(p);
    };
    const navigateUp = () => { const parts = currentPath.split("/").filter(Boolean); parts.pop(); setCurrentPath(parts.join("/")); setViewingFile(null); };
    const goToRoot = () => { setCurrentPath(""); setViewingFile(null); };
    const openFileModal = () => { setShowFileModal(true); setFileMode("write"); setFileName(""); setFileContent(""); setCommitMessage(""); setDetectedLang("Plain Text"); };
    const closeFileModal = () => { setShowFileModal(false); setFileName(""); setFileContent(""); setCommitMessage(""); };

    const submitFile = async () => {
        if (!fileName.trim() || !fileContent || !commitMessage.trim()) { alert("Please fill in all fields"); return; }
        setIsSubmitting(true);
        try {
            await createFileMutation({ ownerUsername: username, repoName, branch: repoInfo?.defaultBranch || "main", path: currentPath ? `${currentPath}/${fileName}` : fileName, content: fileContent, message: commitMessage, author: user?.displayName || user?.username || "Anonymous" });
            closeFileModal();
        } catch (err: any) { alert(err.message || "Failed to create file"); } finally { setIsSubmitting(false); }
    };

    const handleSpark = async (id: string) => { if (!user || !repoInfo) return; await toggleSpark({ userId: user.id as Id<"users">, repoId: repoInfo._id, emoji: id }); setShowSparkPicker(false); };

    const submitThread = async () => {
        if (!threadTitle.trim() || !threadBody.trim() || !user || !repoInfo) return;
        await createThread({ repoId: repoInfo._id, authorId: user.id as Id<"users">, authorUsername: user.username, title: threadTitle, body: threadBody });
        setShowThreadModal(false); setThreadTitle(""); setThreadBody("");
    };

    const handleRemix = async () => {
        if (!user || !repoInfo) return;
        if (user.username === username) { alert("You can't remix your own repo!"); return; }
        try {
            const result = await remixMutation({ sourceOwnerUsername: username, sourceRepoName: repoName, newOwnerId: user.id as Id<"users">, newOwnerUsername: user.username });
            alert(`Remixed! Find it at /${user.username}/${result.name}`);
        } catch (err: any) { alert(err.message || "Failed to remix"); }
    };

    const submitPatch = async () => {
        if (!patchTitle.trim() || !patchDesc.trim() || !user || !repoInfo) return;
        await createPatch({ sourceRepoId: repoInfo._id, targetRepoId: repoInfo._id, authorId: user.id as Id<"users">, authorUsername: user.username, title: patchTitle, description: patchDesc, sourceBranch: "main", targetBranch: repoInfo.defaultBranch });
        setShowPatchModal(false); setPatchTitle(""); setPatchDesc("");
    };

    const filteredPatches = patches ? (patchFilter === "all" ? patches : patches.filter(p => p.status === patchFilter)) : [];
    const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const formatTimeAgo = (ts: number) => { const s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };

    if (repoInfo === undefined) return <div className="min-h-screen flex items-center justify-center pt-16"><div className="text-[var(--kit-text-muted)]">Loading repository...</div></div>;
    if (repoInfo === null) return <div className="min-h-screen flex items-center justify-center pt-16"><div className="text-center"><div className="text-4xl mb-4">😕</div><h2 className="text-xl font-bold text-white mb-2">Repository not found</h2><p className="text-sm text-[var(--kit-text-muted)]">{username}/{repoName} doesn&apos;t exist.</p></div></div>;

    const isOwner = user?.username === username;

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[var(--kit-text-muted)] mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                            <Link href={`/${username}`} className="hover:text-orange-400 transition-colors">{username}</Link>
                            <span>/</span>
                            <span className="text-white font-semibold">{repoName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ml-2 ${repoInfo.isPublic ? "border-[var(--kit-border)] text-[var(--kit-text-muted)]" : "border-yellow-500/30 text-yellow-400"}`}>{repoInfo.isPublic ? "Public" : "Private"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Spark */}
                            <div className="relative">
                                <button onClick={() => user ? setShowSparkPicker(!showSparkPicker) : alert("Sign in to spark!")}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${userSpark ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "glass text-[var(--kit-text-muted)] hover:text-white"}`}>
                                    {userSpark ? SPARK_MAP[userSpark.emoji] || "⚡" : "⚡"} <span>{sparkData?.total || 0}</span>
                                </button>
                                {showSparkPicker && (
                                    <div className="absolute top-full right-0 mt-2 glass rounded-xl p-2 flex gap-1 z-50 shadow-xl shadow-black/50">
                                        {SPARK_IDS.map(id => (
                                            <button key={id} onClick={() => handleSpark(id)}
                                                className={`w-9 h-9 rounded-lg text-lg hover:bg-orange-500/20 transition-all flex items-center justify-center ${userSpark?.emoji === id ? "bg-orange-500/30 ring-1 ring-orange-400" : ""}`}>
                                                {SPARK_MAP[id]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {user && !isOwner && (
                                <button onClick={handleRemix} className="px-3 py-1.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white text-sm font-medium transition-all flex items-center gap-1.5">
                                    🎵 Remix {remixCount ? `(${remixCount})` : ""}
                                </button>
                            )}
                            {isOwner && (
                                <>
                                    <Link href={`/${username}/${repoName}/settings`} className="px-3 py-1.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white text-sm font-medium transition-all flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Settings
                                    </Link>
                                    <button onClick={openFileModal} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add file
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {repoInfo.description && <p className="text-sm text-[var(--kit-text-muted)] mt-1">{repoInfo.description}</p>}
                    {repoInfo.forkedFromName && <p className="text-xs text-[var(--kit-text-muted)] mt-1">🎵 Remixed from <Link href={`/${repoInfo.forkedFromName}`} className="text-orange-400 hover:text-orange-300">{repoInfo.forkedFromName}</Link></p>}
                    {sparkData && sparkData.total > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            {sparkData.counts.map((c: { id: string; count: number }) => (
                                <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--kit-text-muted)]">{SPARK_MAP[c.id] || c.id} {c.count}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Clone */}
                        <div className="glass rounded-xl p-3 mb-6 flex items-center gap-3">
                    <span className="text-xs text-[var(--kit-text-muted)]">Clone:</span>
                    <code className="text-xs code-font text-orange-300 flex-1">kit clone {username}/{repoName}</code>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-[var(--kit-border)]">
                    {(["code", "commits", "threads", "patches"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-orange-500 text-white" : "border-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>
                            {t === "code" ? "📁 Code" : t === "commits" ? `📝 Commits${commits?.length ? ` (${commits.length})` : ""}` : t === "threads" ? `🧵 Threads${threads?.length ? ` (${threads.length})` : ""}` : `🩹 Patches${patches?.length ? ` (${patches.length})` : ""}`}
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
                                    <table className="w-full"><tbody>
                                        {fileData.content.split("\n").map((line, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-0 text-right select-none text-xs code-font text-[var(--kit-text-muted)]/40 w-12">{i + 1}</td>
                                                <td className="px-4 py-0"><pre className="text-sm code-font text-[var(--kit-text)] whitespace-pre">{line}</pre></td>
                                            </tr>
                                        ))}
                                    </tbody></table>
                                </div>
                            </div>
                        ) : (
                            <>
                            <div className="glass rounded-xl overflow-hidden">
                                {currentPath && (
                                    <div className="flex items-center gap-1 px-4 py-3 border-b border-[var(--kit-border)] text-sm">
                                        <button onClick={goToRoot} className="text-orange-400 hover:text-orange-300">{repoName}</button>
                                        {currentPath.split("/").map((part, i, arr) => (
                                            <span key={i} className="flex items-center gap-1">
                                                <span className="text-[var(--kit-text-muted)]">/</span>
                                                <button onClick={() => setCurrentPath(arr.slice(0, i + 1).join("/"))} className={i === arr.length - 1 ? "text-white font-medium" : "text-orange-400 hover:text-orange-300"}>{part}</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {currentPath && <button onClick={navigateUp} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--kit-text-muted)] hover:bg-[var(--kit-surface-2)] transition-colors border-b border-[var(--kit-border)]"><span>📂</span> ..</button>}
                                {tree === undefined ? (
                                    <div className="p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading...</div>
                                ) : !tree.entries || tree.entries.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="text-3xl mb-3">📭</div>
                                        <p className="text-sm text-[var(--kit-text-muted)]">{currentPath ? "This directory is empty." : "This repository is empty. Add a file to get started!"}</p>
                                        {isOwner && !currentPath && <button onClick={openFileModal} className="mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">+ Add your first file</button>}
                                    </div>
                                ) : (
                                    [...tree.entries].sort((a, b) => { if (a.type === "tree" && b.type !== "tree") return -1; if (a.type !== "tree" && b.type === "tree") return 1; return a.name.localeCompare(b.name); }).map(entry => {
                                        const filePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                                        const lastCommit = entry.type === "blob" && fileCommits?.[filePath];
                                        return (
                                            <button key={entry.name} onClick={() => handleEntryClick(entry)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--kit-surface-2)] transition-colors border-b border-[var(--kit-border)] last:border-b-0">
                                                <span>{entry.type === "tree" ? "📁" : getFileIcon(entry.name)}</span>
                                                <span className={entry.type === "tree" ? "text-orange-400 font-medium" : "text-white"}>{entry.name}</span>
                                                <span className="ml-auto text-xs text-[var(--kit-text-muted)]">{entry.type === "blob" ? detectLanguage(entry.name) : ""}</span>
                                                {lastCommit && (
                                                    <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--kit-text-muted)] ml-4">
                                                        <span className="truncate max-w-[150px]">{lastCommit.message}</span>
                                                        <span>{formatTimeAgo(lastCommit.timestamp * 1000)}</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {/* README display - only at root level when not viewing a file */}
                            {!viewingFile && !currentPath && readme && readme.content && (
                                <div className="glass rounded-xl p-6 mt-6">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--kit-border)]">
                                        <span className="text-lg">📖</span>
                                        <h3 className="text-sm font-semibold text-white">README.md</h3>
                                    </div>
                                    <Markdown content={readme.content} />
                                </div>
                            )}
                            </>
                        )}
                    </>
                )}

                {/* Commits Tab */}
                {tab === "commits" && (
                    <div className="space-y-2">
                        {commits === undefined ? <div className="glass rounded-xl p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading commits...</div>
                            : commits.length === 0 ? <div className="glass rounded-xl p-12 text-center"><div className="text-3xl mb-3">📝</div><p className="text-sm text-[var(--kit-text-muted)]">No commits yet.</p></div>
                                : commits.map(c => (
                                    <div key={c.hash} className="glass rounded-xl p-4 hover:border-orange-500/30 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div><p className="text-sm font-medium text-white mb-1">{c.message}</p><p className="text-xs text-[var(--kit-text-muted)]">{c.author} committed {formatDate(c.timestamp)}</p></div>
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
                            <h3 className="text-sm font-medium text-[var(--kit-text-muted)]">{threads ? `${threads.length} thread${threads.length !== 1 ? "s" : ""}` : "Loading..."}</h3>
                            {user && <button onClick={() => setShowThreadModal(true)} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">+ New Thread</button>}
                        </div>
                        {threads === undefined ? <div className="glass rounded-xl p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading threads...</div>
                            : threads.length === 0 ? (
                                <div className="glass rounded-xl p-12 text-center">
                                    <div className="text-3xl mb-3">🧵</div>
                                    <h3 className="text-lg font-semibold text-white mb-2">No threads yet</h3>
                                    <p className="text-sm text-[var(--kit-text-muted)] mb-4">Start a discussion about this project!</p>
                                    {user && <button onClick={() => setShowThreadModal(true)} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">Start a Thread</button>}
                                </div>
                            ) : threads.map(thread => (
                                <div key={thread._id} className="glass rounded-xl p-5 hover:border-orange-500/30 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${thread.status === "open" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-purple-500/20 text-purple-400 border border-purple-500/30"}`}>{thread.status === "open" ? "● Open" : "✓ Resolved"}</span>
                                        <h4 className="text-sm font-semibold text-white">{thread.title}</h4>
                                    </div>
                                    <p className="text-xs text-[var(--kit-text-muted)] line-clamp-2 mb-2">{thread.body}</p>
                                    <div className="flex items-center gap-3 text-xs text-[var(--kit-text-muted)]">
                                        <span>by <span className="text-orange-400">{thread.authorUsername}</span></span>
                                        <span>{formatTimeAgo(thread.timestamp)}</span>
                                        {(thread.replyCount || 0) > 0 && <span>💬 {thread.replyCount} replies</span>}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Patches Tab */}
                {tab === "patches" && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {(["open", "merged", "closed", "all"] as const).map(f => (
                                    <button key={f} onClick={() => setPatchFilter(f)} className={`text-xs px-3 py-1 rounded-full transition-all ${patchFilter === f ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "text-[var(--kit-text-muted)] hover:text-white"}`}>
                                        {f === "open" ? "● Open" : f === "merged" ? "✓ Merged" : f === "closed" ? "✕ Closed" : "All"}
                                    </button>
                                ))}
                            </div>
                            {user && <button onClick={() => setShowPatchModal(true)} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">+ New Patch</button>}
                        </div>
                        {patches === undefined ? <div className="glass rounded-xl p-8 text-center text-sm text-[var(--kit-text-muted)]">Loading patches...</div>
                            : filteredPatches.length === 0 ? (
                                <div className="glass rounded-xl p-12 text-center">
                                    <div className="text-3xl mb-3">🩹</div>
                                    <h3 className="text-lg font-semibold text-white mb-2">No {patchFilter !== "all" ? patchFilter : ""} patches</h3>
                                    <p className="text-sm text-[var(--kit-text-muted)] mb-4">Submit a patch to propose changes!</p>
                                </div>
                            ) : filteredPatches.map(patch => (
                                <div key={patch._id} className="glass rounded-xl p-5 hover:border-orange-500/30 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${patch.status === "open" ? "bg-green-500/20 text-green-400 border border-green-500/30" : patch.status === "merged" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                                    {patch.status === "open" ? "● Open" : patch.status === "merged" ? "✓ Merged" : "✕ Closed"}
                                                </span>
                                                <h4 className="text-sm font-semibold text-white">{patch.title}</h4>
                                            </div>
                                            <p className="text-xs text-[var(--kit-text-muted)] line-clamp-2 mb-2">{patch.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-[var(--kit-text-muted)]">
                                                <span>by <span className="text-orange-400">{patch.authorUsername}</span></span>
                                                <span>{formatTimeAgo(patch.timestamp)}</span>
                                                <span className="code-font">{patch.sourceBranch} → {patch.targetBranch}</span>
                                            </div>
                                        </div>
                                        {isOwner && patch.status === "open" && (
                                            <div className="flex gap-1 ml-3">
                                                <button onClick={() => mergePatch({ patchId: patch._id, userId: user!.id as Id<"users"> })} className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">Merge</button>
                                                <button onClick={() => closePatch({ patchId: patch._id, userId: user!.id as Id<"users"> })} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Close</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                )}

                </div>
            </div>

                {/* Sidebar */}
                <aside className="hidden lg:block w-72 flex-shrink-0">
                    <div className="sticky top-24 space-y-4">
                        {/* About */}
                        <div className="glass rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-white mb-3">About</h3>
                            {repoInfo.description && <p className="text-sm text-[var(--kit-text-muted)] mb-3">{repoInfo.description}</p>}
                            <div className="flex items-center gap-4 text-xs text-[var(--kit-text-muted)]">
                                {repoInfo.isPublic && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg> Public</span>}
                                <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> {repoStats?.contributors || 0} contributors</span>
                            </div>
                        </div>

                        {/* Stats */}
                        {repoStats && (
                            <>
                                {/* Languages */}
                                {repoStats.languages.length > 0 && (
                                    <div className="glass rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-white mb-3">Languages</h3>
                                        <div className="flex h-2 rounded-full overflow-hidden mb-2">
                                            {repoStats.languages.slice(0, 6).map((lang, i) => (
                                                <div
                                                    key={i}
                                                    className="h-full"
                                                    style={{
                                                        backgroundColor: lang.color,
                                                        width: `${lang.percentage}%`,
                                                    }}
                                                    title={`${lang.name} (${lang.percentage}%)`}
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-1.5">
                                            {repoStats.languages.slice(0, 5).map((lang) => (
                                                <div key={lang.name} className="flex items-center gap-2 text-xs">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: lang.color }}
                                                    />
                                                    <span className="text-[var(--kit-text-muted)] flex-1">{lang.name}</span>
                                                    <span className="text-white">{lang.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Latest Commit */}
                                {repoStats.latestCommit && (
                                    <div className="glass rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-white mb-3">Latest Commit</h3>
                                        <div className="text-xs">
                                            <p className="text-white font-medium mb-1">{repoStats.latestCommit.message}</p>
                                            <div className="flex items-center gap-2 text-[var(--kit-text-muted)]">
                                                <span>{repoStats.latestCommit.author}</span>
                                                <span>•</span>
                                                <span>{formatTimeAgo(repoStats.latestCommit.timestamp * 1000)}</span>
                                            </div>
                                            <code className="mt-2 block text-orange-400 code-font text-[10px]">{repoStats.latestCommit.hash}</code>
                                        </div>
                                    </div>
                                )}

                                {/* Quick Stats */}
                                <div className="glass rounded-xl p-4">
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div>
                                            <div className="text-lg font-bold text-white">{repoStats.commits}</div>
                                            <div className="text-xs text-[var(--kit-text-muted)]">Commits</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-white">{repoStats.fileCount}</div>
                                            <div className="text-xs text-[var(--kit-text-muted)]">Files</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </aside>
            </div>

            {/* File Modal */}
            {showFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeFileModal}>
                    <div className="glass rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kit-border)]">
                            <h2 className="text-lg font-bold text-white">Create new file</h2>
                            <button onClick={closeFileModal} className="text-[var(--kit-text-muted)] hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="flex rounded-lg overflow-hidden border border-[var(--kit-border)]">
                                <button onClick={() => setFileMode("write")} className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${fileMode === "write" ? "bg-orange-600 text-white" : "bg-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>✏️ Write</button>
                                <button onClick={() => setFileMode("upload")} className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${fileMode === "upload" ? "bg-orange-600 text-white" : "bg-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>📤 Upload</button>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)]">File name</label>
                                    {fileName && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{detectedLang}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentPath && <span className="text-sm text-[var(--kit-text-muted)] code-font">{currentPath}/</span>}
                                    <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font" placeholder="filename.txt" autoFocus />
                                </div>
                            </div>
                            {fileMode === "write" ? (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Content</label>
                                    <textarea value={fileContent} onChange={e => setFileContent(e.target.value)} className="w-full h-64 px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors code-font text-sm resize-none leading-5" placeholder="// Start typing..." />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Upload file</label>
                                    <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-[var(--kit-border)] rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50 transition-all group">
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                                        {fileContent ? (
                                            <div><div className="text-2xl mb-2">{getFileIcon(fileName)}</div><p className="text-sm font-medium text-white mb-1">{fileName}</p><p className="text-xs text-[var(--kit-text-muted)]">{detectedLang} • {fileContent.length} chars</p><p className="text-xs text-orange-400 mt-2">Click to change</p></div>
                                        ) : (
                                            <div><div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📤</div><p className="text-sm text-white mb-1">Drop a file here or click to browse</p><p className="text-xs text-[var(--kit-text-muted)]">Supports text files, code, configs, docs</p></div>
                                        )}
                                    </div>
                                    {fileContent && <div className="mt-3 glass rounded-lg p-3 max-h-32 overflow-auto"><p className="text-xs text-[var(--kit-text-muted)] mb-1">Preview:</p><pre className="text-xs code-font text-white/70 whitespace-pre-wrap">{fileContent.slice(0, 500)}{fileContent.length > 500 ? "..." : ""}</pre></div>}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Commit message</label>
                                <input type="text" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors" placeholder={`Add ${fileName || "new file"}`} />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button onClick={submitFile} disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Committing..." : "Commit new file"}</button>
                            <button onClick={closeFileModal} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Thread Modal */}
            {showThreadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowThreadModal(false)}>
                    <div className="glass rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kit-border)]"><h2 className="text-lg font-bold text-white">🧵 New Thread</h2><button onClick={() => setShowThreadModal(false)} className="text-[var(--kit-text-muted)] hover:text-white">✕</button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Title</label><input type="text" value={threadTitle} onChange={e => setThreadTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors" placeholder="What's on your mind?" autoFocus /></div>
                            <div><label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Body</label><textarea value={threadBody} onChange={e => setThreadBody(e.target.value)} className="w-full h-32 px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors text-sm resize-none" placeholder="Describe your question, idea, or feedback..." /></div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button onClick={submitThread} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all">Post Thread</button>
                            <button onClick={() => setShowThreadModal(false)} className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Patch Modal */}
            {showPatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPatchModal(false)}>
                    <div className="glass rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kit-border)]"><h2 className="text-lg font-bold text-white">🩹 New Patch</h2><button onClick={() => setShowPatchModal(false)} className="text-[var(--kit-text-muted)] hover:text-white">✕</button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Title</label><input type="text" value={patchTitle} onChange={e => setPatchTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors" placeholder="Fix: bug in main component" autoFocus /></div>
                            <div><label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Description</label><textarea value={patchDesc} onChange={e => setPatchDesc(e.target.value)} className="w-full h-32 px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors text-sm resize-none" placeholder="Describe the changes you're proposing..." /></div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--kit-border)]">
                            <button onClick={submitPatch} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-all">Submit Patch</button>
                            <button onClick={() => setShowPatchModal(false)} className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* KitBot AI Assistant */}
            <KitBot
                repoName={repoName}
                username={username}
                currentFile={viewingFile}
                fileContent={fileData?.content}
                repoContext={repoInfo?.description}
            />
        </div>
    );
}
