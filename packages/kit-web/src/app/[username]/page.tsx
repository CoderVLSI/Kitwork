"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const rawParams = use(params);
    const username = decodeURIComponent(rawParams.username);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (stored) {
            setCurrentUser(JSON.parse(stored));
        }
    }, []);

    const profileUser = useQuery(api.users.getByUsername, { username });
    const userRepos = useQuery(
        api.repos.listByUser,
        { ownerUsername: username }
    );

    const isOwnProfile = currentUser?.username === username;

    if (profileUser === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-[var(--kit-text-muted)]">Loading...</div>
            </div>
        );
    }

    if (profileUser === null) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-bold text-white mb-2">User not found</h2>
                    <p className="text-sm text-[var(--kit-text-muted)]">@{username} doesn&apos;t exist.</p>
                </div>
            </div>
        );
    }

    const publicRepos = userRepos?.filter(r => r.isPublic) || [];
    const repoCount = publicRepos.length;

    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="glass rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/25">
                            {profileUser.displayName?.[0]?.toUpperCase() || username[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-white">{profileUser.displayName || username}</h1>
                                <span className="text-sm text-[var(--kit-text-muted)]">@{username}</span>
                            </div>
                            {profileUser.bio && (
                                <p className="text-[var(--kit-text-muted)] mb-4">{profileUser.bio}</p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-1.5 text-[var(--kit-text-muted)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span><strong className="text-white">{repoCount}</strong> repositories</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--kit-text-muted)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Member</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repositories Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Popular repositories
                        </h2>
                        {isOwnProfile && (
                            <Link
                                href="/dashboard"
                                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                            >
                                View all →
                            </Link>
                        )}
                    </div>

                    {publicRepos.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold text-white mb-2">No public repositories yet</h3>
                            <p className="text-sm text-[var(--kit-text-muted)]">
                                {isOwnProfile
                                    ? "Create your first repository or make an existing one public."
                                    : `${username} hasn't created any public repositories yet.`}
                            </p>
                            {isOwnProfile && (
                                <Link
                                    href="/dashboard"
                                    className="inline-block mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all"
                                >
                                    Go to Dashboard
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {publicRepos.slice(0, 6).map((repo) => (
                                <Link
                                    key={repo._id}
                                    href={`/${username}/${repo.name}`}
                                    className="glass rounded-xl p-5 hover:border-orange-500/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-base font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
                                            {repo.name}
                                        </h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--kit-border)] text-[var(--kit-text-muted)]">
                                            Public
                                        </span>
                                    </div>
                                    {repo.description && (
                                        <p className="text-sm text-[var(--kit-text-muted)] line-clamp-2">{repo.description}</p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Section (placeholder) */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent activity
                    </h2>
                    <div className="glass rounded-xl p-8 text-center">
                        <p className="text-sm text-[var(--kit-text-muted)]">Activity feed coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
