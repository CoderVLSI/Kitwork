"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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
        if (stored) setCurrentUser(JSON.parse(stored));
    }, []);

    const profileUser = useQuery(api.users.getByUsername, { username });
    const userRepos = useQuery(api.repos.listByUser, { ownerUsername: username });
    const activities = useQuery(api.activities.getActivities, { username });

    // Crew data
    const crewCounts = useQuery(api.crew.getCounts,
        profileUser ? { userId: profileUser.id as Id<"users"> } : "skip"
    );
    const isFollowing = useQuery(api.crew.isFollowing,
        currentUser && profileUser && currentUser.id !== profileUser.id
            ? { followerId: currentUser.id as Id<"users">, followingId: profileUser.id as Id<"users"> }
            : "skip"
    );
    const toggleCrew = useMutation(api.crew.toggle);

    const isOwnProfile = currentUser?.username === username;

    const handleCrewToggle = async () => {
        if (!currentUser || !profileUser) return;
        await toggleCrew({
            followerId: currentUser.id as Id<"users">,
            followingId: profileUser.id as Id<"users">,
        });
    };

    if (profileUser === undefined) {
        return (<div className="min-h-screen flex items-center justify-center pt-16"><div className="text-[var(--kit-text-muted)]">Loading...</div></div>);
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

    const publicRepos = userRepos?.filter((r: any) => r.isPublic) || [];

    const formatDate = (ts: number) => {
        const seconds = Math.floor((Date.now() - ts * 1000) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "repo_created": return "📦";
            case "file_created":
            case "commit_pushed": return "📝";
            case "profile_updated": return "👤";
            default: return "📌";
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="glass rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-6">
                        {profileUser.avatarUrl ? (
                            <img src={profileUser.avatarUrl} alt="Avatar"
                                className="w-24 h-24 rounded-2xl object-cover shadow-lg shadow-orange-500/25" />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/25">
                                {profileUser.displayName?.[0]?.toUpperCase() || username[0].toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-white">{profileUser.displayName || username}</h1>
                                <span className="text-sm text-[var(--kit-text-muted)]">@{username}</span>
                                {isOwnProfile ? (
                                    <Link href="/settings"
                                        className="text-xs px-3 py-1 rounded-full border border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white hover:border-white/30 transition-all">
                                        Edit profile
                                    </Link>
                                ) : currentUser && (
                                    <button onClick={handleCrewToggle}
                                        className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${isFollowing
                                            ? "bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
                                            : "bg-orange-600 text-white hover:bg-orange-500"}`}>
                                        {isFollowing ? "👥 In Crew" : "➕ Join Crew"}
                                    </button>
                                )}
                            </div>
                            {profileUser.bio && (
                                <p className="text-[var(--kit-text-muted)] mb-4">{profileUser.bio}</p>
                            )}

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-1.5 text-[var(--kit-text-muted)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span><strong className="text-white">{publicRepos.length}</strong> repos</span>
                                </div>
                                {crewCounts && (
                                    <>
                                        <div className="flex items-center gap-1.5 text-[var(--kit-text-muted)]">
                                            <span>👥</span>
                                            <span><strong className="text-white">{crewCounts.followers}</strong> crew</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[var(--kit-text-muted)]">
                                            <span>👤</span>
                                            <span><strong className="text-white">{crewCounts.following}</strong> following</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contribution Heatmap Placeholder */}
                <div className="glass rounded-2xl p-6 mb-8">
                    <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        🔥 Contribution Activity
                    </h2>
                    <div className="grid grid-cols-[repeat(52,1fr)] gap-[3px]">
                        {Array.from({ length: 364 }, (_, i) => {
                            // Simulate some activity data based on activities
                            const level = activities && activities.length > 0
                                ? Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0
                                : 0;
                            const colors = [
                                "bg-[var(--kit-border)]",
                                "bg-orange-900/60",
                                "bg-orange-700/70",
                                "bg-orange-500/80",
                                "bg-orange-400",
                            ];
                            return (
                                <div key={i} className={`aspect-square rounded-[2px] ${colors[level]}`}
                                    title={`${level} contributions`} />
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-[var(--kit-text-muted)]">
                        <span>Less</span>
                        {["bg-[var(--kit-border)]", "bg-orange-900/60", "bg-orange-700/70", "bg-orange-500/80", "bg-orange-400"].map((c, i) => (
                            <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
                        ))}
                        <span>More</span>
                    </div>
                </div>

                {/* Repositories Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            📦 Repositories
                        </h2>
                        {isOwnProfile && (
                            <Link href="/dashboard" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                                View all →
                            </Link>
                        )}
                    </div>

                    {publicRepos.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold text-white mb-2">No public repositories yet</h3>
                            <p className="text-sm text-[var(--kit-text-muted)]">
                                {isOwnProfile ? "Create your first repository!" : `${username} hasn't created any public repositories yet.`}
                            </p>
                            {isOwnProfile && (
                                <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all">
                                    Go to Dashboard
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {publicRepos.slice(0, 6).map((repo: any) => (
                                <Link key={repo._id} href={`/${username}/${repo.name}`}
                                    className="glass rounded-xl p-5 hover:border-orange-500/50 transition-all group">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-base font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">{repo.name}</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--kit-border)] text-[var(--kit-text-muted)]">Public</span>
                                    </div>
                                    {repo.description && <p className="text-sm text-[var(--kit-text-muted)] line-clamp-2">{repo.description}</p>}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Section */}
                <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        ⏱️ Recent Activity
                    </h2>

                    {activities === undefined ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <p className="text-sm text-[var(--kit-text-muted)]">Loading activity...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <p className="text-sm text-[var(--kit-text-muted)]">No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activities.map((activity: any) => (
                                <div key={activity._id} className="glass rounded-xl p-4 hover:border-orange-500/30 transition-all">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">{getActivityIcon(activity.type)}</span>
                                        <div className="flex-1">
                                            <p className="text-sm text-white">{activity.description}</p>
                                            <p className="text-xs text-[var(--kit-text-muted)] mt-1">{formatDate(activity.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
