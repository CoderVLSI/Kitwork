"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ExplorePage() {
    const repos = useQuery(api.repos.listPublic);

    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-purple-300 mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Discover
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                        Explore Repositories
                    </h1>
                    <p className="text-[var(--kit-text-muted)] text-lg">
                        Browse open source projects built with Kitwork
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-white">{repos?.length || 0}</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Repositories</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-white">Free</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Forever</div>
                    </div>
                    <div className="glass rounded-xl p-5 text-center">
                        <div className="text-2xl font-bold text-white">Open</div>
                        <div className="text-xs text-[var(--kit-text-muted)] mt-1">Source</div>
                    </div>
                </div>

                {/* Search */}
                <div className="glass rounded-xl p-4 mb-8 flex items-center gap-3">
                    <svg className="w-5 h-5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        className="flex-1 bg-transparent text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none"
                    />
                </div>

                {/* Repos List */}
                <div className="space-y-3">
                    {repos === undefined ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <div className="text-sm text-[var(--kit-text-muted)]">Loading repositories...</div>
                        </div>
                    ) : repos.length === 0 ? (
                        <div className="glass rounded-2xl p-16 text-center">
                            <div className="text-5xl mb-4">📦</div>
                            <h2 className="text-xl font-semibold text-white mb-2">No public repositories yet</h2>
                            <p className="text-sm text-[var(--kit-text-muted)] mb-6">
                                Be the first to create a public repository on Kitwork!
                            </p>
                            <Link
                                href="/register"
                                className="inline-block px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all"
                            >
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        repos.map((repo) => (
                            <Link
                                key={repo._id}
                                href={`/${repo.ownerUsername}/${repo.name}`}
                                className="block glass rounded-xl p-5 hover:border-purple-500/50 transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-lg font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                                                {repo.name}
                                            </h3>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--kit-border)] text-[var(--kit-text-muted)]">
                                                Public
                                            </span>
                                        </div>
                                        {repo.description && (
                                            <p className="text-sm text-[var(--kit-text-muted)] mb-3 line-clamp-2">
                                                {repo.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-[var(--kit-text-muted)]">
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <Link
                                                    href={`/${repo.ownerUsername}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:text-purple-400 transition-colors"
                                                >
                                                    {repo.ownerUsername}
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                                <span>Code</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span>{repo.defaultBranch}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-[var(--kit-text-muted)] group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
