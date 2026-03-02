"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [newRepo, setNewRepo] = useState({ name: "", description: "", isPublic: true });

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (!stored) {
            window.location.href = "/login";
            return;
        }
        setUser(JSON.parse(stored));
    }, []);

    const repos = useQuery(
        api.repos.listByUser,
        user ? { ownerUsername: user.username } : "skip"
    );

    const userStats = useQuery(
        api.repos.getUserStats,
        user ? { ownerUsername: user.username } : "skip"
    );

    const createRepoMutation = useMutation(api.repos.create);

    const createRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validate repo name: no spaces, only alphanumeric and dash/underscore
        const nameValidation = /^[a-zA-Z0-9_-]+$/;
        if (!nameValidation.test(newRepo.name)) {
            alert("Repository name can only contain letters, numbers, dashes, and underscores (no spaces).");
            return;
        }

        try {
            await createRepoMutation({
                name: newRepo.name,
                ownerId: user.id as Id<"users">,
                ownerUsername: user.username,
                description: newRepo.description || undefined,
                isPublic: newRepo.isPublic,
            });
            setShowNew(false);
            setNewRepo({ name: "", description: "", isPublic: true });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const logout = () => {
        localStorage.removeItem("kit_user");
        window.location.href = "/";
    };

    const timeAgo = (ts: number) => {
        const now = Date.now();
        const seconds = Math.floor((now - ts) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-[var(--kit-text-muted)]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <p className="text-sm text-[var(--kit-text-muted)]">
                            Welcome back, <span className="text-[var(--kit-amber)]">{user.displayName || user.username}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowNew(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                        >
                            + New Repository
                        </button>
                        <button
                            onClick={logout}
                            className="px-4 py-2 rounded-lg glass text-[var(--kit-text-muted)] text-sm hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-white">{repos?.length || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Repositories</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-indigo-400">{userStats?.totalRemixes || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1 flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Total Remixes
                        </div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-orange-400">{userStats?.totalCommits || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Total Commits</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-green-400">{userStats?.remixedRepos?.length || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Remixed Repos</div>
                    </div>
                </div>

                {/* Remix Activity */}
                {userStats && userStats.remixedRepos.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            Remix Activity
                        </h2>
                        <div className="space-y-2">
                            {userStats.remixedRepos.map((repo: any) => (
                                <Link key={repo._id} href={`/${user.username}/${repo.name}`} className="block glass rounded-xl p-4 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{repo.name}</div>
                                                <div className="text-xs text-[var(--kit-text-muted)]">{repo.remixCount} remix{repo.remixCount > 1 ? "es" : ""}</div>
                                            </div>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {repo.remixedBy.slice(0, 3).map((remixer: any, i: number) => (
                                                <Link key={i} href={`/${remixer.ownerUsername}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-[var(--kit-bg)] hover:z-10 transition-all" title={remixer.ownerUsername}>
                                                    {remixer.ownerUsername[0].toUpperCase()}
                                                </Link>
                                            ))}
                                            {repo.remixedBy.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-[var(--kit-surface-2)] flex items-center justify-center text-[var(--kit-text-muted)] text-xs ring-2 ring-[var(--kit-bg)]">
                                                    +{repo.remixedBy.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Repo Modal */}
                {showNew && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
                        <div className="glass-glow rounded-2xl p-8 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-xl font-bold text-white mb-6">Create a new repository</h2>
                            <form onSubmit={createRepo} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Repository name</label>
                                    <input
                                        type="text"
                                        value={newRepo.name}
                                        onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                                        pattern="[a-zA-Z0-9_-]+"
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="my-awesome-project"
                                        required
                                    />
                                    <p className="text-xs text-[var(--kit-text-muted)] mt-1">Letters, numbers, dashes, and underscores only (no spaces)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={newRepo.description}
                                        onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="A short description"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={newRepo.isPublic} onChange={(e) => setNewRepo({ ...newRepo, isPublic: e.target.checked })} className="rounded" />
                                    <span className="text-sm text-[var(--kit-text-muted)]">Public repository</span>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all">Create Repository</button>
                                    <button type="button" onClick={() => setShowNew(false)} className="px-6 py-3 rounded-xl glass text-[var(--kit-text-muted)] hover:text-white transition-colors">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Repos */}
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Repositories
                    </h2>

                    {repos === undefined ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <div className="text-sm text-[var(--kit-text-muted)]">Loading repos...</div>
                        </div>
                    ) : repos.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold text-white mb-2">No repositories yet</h3>
                            <p className="text-sm text-[var(--kit-text-muted)] mb-6">Create your first repository or push from the CLI.</p>
                            <button onClick={() => setShowNew(true)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                                + New Repository
                            </button>
                        </div>
                    ) : (
                        repos.map((repo) => (
                            <Link
                                key={repo._id}
                                href={`/${user.username}/${repo.name}`}
                                className="block glass-glow rounded-xl p-5 hover:border-indigo-500/30 transition-all group hover-lift"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-[var(--kit-indigo)] group-hover:text-indigo-400 transition-colors">
                                                {user.username}/{repo.name}
                                            </h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${repo.isPublic ? "border-[var(--kit-border)] text-[var(--kit-text-muted)]" : "border-yellow-500/30 text-yellow-400"}`}>
                                                {repo.isPublic ? "Public" : "Private"}
                                            </span>
                                        </div>
                                        {repo.description && <p className="text-sm text-[var(--kit-text-muted)]">{repo.description}</p>}
                                    </div>
                                    <span className="text-xs text-[var(--kit-text-muted)]">
                                        {timeAgo(repo._creationTime)}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Quick Start */}
                <div className="mt-12 glass-glow rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-3">Quick start — push an existing project</h3>
                    <div className="code-font text-xs text-[var(--kit-text-muted)] space-y-1 bg-[var(--kit-bg)] rounded-xl p-4">
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> init</div>
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> add .</div>
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> commit -m <span className="text-yellow-300">&quot;first commit&quot;</span></div>
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> push origin main</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
