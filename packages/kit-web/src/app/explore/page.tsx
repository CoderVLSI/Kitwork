"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const SPARK_MAP: Record<string, string> = {
    bolt: "⚡", fire: "🔥", rocket: "🚀", gem: "💎", target: "🎯",
};

export default function ExplorePage() {
    const [activeTab, setActiveTab] = useState<"trending" | "active" | "newest">("trending");
    const [search, setSearch] = useState("");
    const exploreData = useQuery(api.repos.getExploreData);

    const tabs = [
        { id: "trending" as const, label: "🔥 Trending", desc: "Most sparked" },
        { id: "active" as const, label: "⚡ Most Active", desc: "Recent commits" },
        { id: "newest" as const, label: "✨ Newest", desc: "Just created" },
    ];

    const tabKeyMap = { trending: "trending", active: "mostActive", newest: "newest" } as const;
    const repos = exploreData ? exploreData[tabKeyMap[activeTab] as keyof typeof exploreData] : [];
    const filtered = search
        ? repos.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()) || r.ownerUsername.toLowerCase().includes(search.toLowerCase()))
        : repos;

    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-orange-300 mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Discover
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Projects</span>
                    </h1>
                    <p className="text-[var(--kit-text-muted)] text-lg">
                        Browse, spark, and remix open source projects on Kitwork
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-white">{repos?.length || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Public Projects</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-orange-400">⚡</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Spark & React</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-orange-400">🎵</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Remix & Build</div>
                    </div>
                </div>

                {/* Search */}
                <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
                    <svg className="w-5 h-5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects..." className="flex-1 bg-transparent text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none" />
                    {search && <button onClick={() => setSearch("")} className="text-xs text-[var(--kit-text-muted)] hover:text-white">✕</button>}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-[var(--kit-border)]">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-orange-500 text-white" : "border-transparent text-[var(--kit-text-muted)] hover:text-white"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Repo List */}
                <div className="space-y-3">
                    {exploreData === undefined ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <div className="text-sm text-[var(--kit-text-muted)]">Loading projects...</div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="glass rounded-2xl p-16 text-center">
                            <div className="text-5xl mb-4">{search ? "🔍" : "📦"}</div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                {search ? "No matching projects" : "No public projects yet"}
                            </h2>
                            <p className="text-sm text-[var(--kit-text-muted)] mb-6">
                                {search ? "Try a different search term" : "Be the first to create a public project on Kitwork!"}
                            </p>
                            {!search && (
                                <Link href="/register" className="inline-block px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">
                                    Get Started
                                </Link>
                            )}
                        </div>
                    ) : (
                        filtered.map((repo: any, index: number) => (
                            <Link key={repo._id} href={`/${repo.ownerUsername}/${repo.name}`}
                                className="block glass rounded-xl p-5 hover:border-orange-500/50 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {activeTab === "trending" && index < 3 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">#{index + 1}</span>
                                            )}
                                            <h3 className="text-lg font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
                                                {repo.ownerUsername}/{repo.name}
                                            </h3>
                                            {repo.forkedFromName && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                    🎵 Remixed from {repo.forkedFromName}
                                                </span>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="text-sm text-[var(--kit-text-muted)] mb-3 line-clamp-2">{repo.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-[var(--kit-text-muted)]">
                                            <span className="flex items-center gap-1">⚡ {repo.sparkCount} sparks</span>
                                            <span className="flex items-center gap-1">📝 {repo.commitCount} commits</span>
                                            {repo.remixCount > 0 && <span className="flex items-center gap-1">🎵 {repo.remixCount} remixes</span>}
                                            <span className="flex items-center gap-1">🔀 {repo.defaultBranch}</span>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-[var(--kit-text-muted)] group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
