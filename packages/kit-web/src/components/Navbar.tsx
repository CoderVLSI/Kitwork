"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
}

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Search queries
    const searchResults = useQuery(api.search.global, { query: searchQuery.length >= 2 ? searchQuery : undefined });

    useEffect(() => {
        const checkAuth = () => {
            const stored = localStorage.getItem("kit_user");
            setUser(stored ? JSON.parse(stored) : null);
        };

        checkAuth();

        const handleStorageChange = () => checkAuth();
        window.addEventListener("storage", handleStorageChange);
        const handleAuthChange = () => checkAuth();
        window.addEventListener("auth-change", handleAuthChange);

        // Keyboard shortcut: "/" to focus search
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // Close search on Escape
            if (e.key === "Escape" && searchOpen) {
                setSearchOpen(false);
                setSearchQuery("");
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-change", handleAuthChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [searchOpen]);

    const handleLogout = () => {
        localStorage.removeItem("kit_user");
        setUser(null);
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid var(--kit-border)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-orange-500/20">
                            <Image
                                src="/mascot.png"
                                alt="Kitwork Mascot"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="text-lg font-bold text-white">
                            Kit<span className="text-orange-400">work</span>
                        </span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:block flex-1 max-w-md mx-8 relative">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchOpen(true)}
                                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                                placeholder="Search /"
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--kit-surface)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-dim)] focus:outline-none focus:border-[var(--kit-primary)] transition-all text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        searchInputRef.current?.focus();
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--kit-text-muted)] hover:text-white p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown */}
                        {searchOpen && searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-[var(--kit-border)] overflow-hidden shadow-xl">
                                {searchResults === undefined ? (
                                    <div className="p-4 text-sm text-[var(--kit-text-muted)] text-center">Searching...</div>
                                ) : searchResults.repos.length === 0 && searchResults.users.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-sm text-[var(--kit-text-muted)]">No results found</p>
                                    </div>
                                ) : (
                                    <>
                                        {searchResults.repos.length > 0 && (
                                            <div className="p-2">
                                                <div className="text-xs text-[var(--kit-text-muted)] px-3 py-1 uppercase tracking-wider">Repositories</div>
                                                {searchResults.repos.slice(0, 5).map((repo: any) => (
                                                    <Link
                                                        key={repo._id}
                                                        href={`/${repo.ownerUsername}/${repo.name}`}
                                                        className="block px-3 py-2 rounded-lg hover:bg-[var(--kit-surface-2)] transition-colors"
                                                        onClick={() => setSearchOpen(false)}
                                                    >
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-orange-400">{repo.ownerUsername}</span>
                                                            <span className="text-[var(--kit-text-muted)]">/</span>
                                                            <span className="text-white font-medium">{repo.name}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.users.length > 0 && (
                                            <div className="p-2 border-t border-[var(--kit-border)]">
                                                <div className="text-xs text-[var(--kit-text-muted)] px-3 py-1 uppercase tracking-wider">Users</div>
                                                {searchResults.users.slice(0, 5).map((u: any) => (
                                                    <Link
                                                        key={u._id}
                                                        href={`/${u.username}`}
                                                        className="block px-3 py-2 rounded-lg hover:bg-[var(--kit-surface-2)] transition-colors"
                                                        onClick={() => setSearchOpen(false)}
                                                    >
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {u.displayName?.[0]?.toUpperCase() || u.username[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-white">{u.displayName || u.username}</span>
                                                            <span className="text-[var(--kit-text-muted)]">@{u.username}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/copilot"
                            className="flex items-center justify-center p-1.5 rounded-lg border border-[var(--kit-border)] bg-gradient-to-br from-[#1a1a24] to-[#12121a] hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all group mr-2"
                            title="KitBot Copilot"
                        >
                            <Image src="/copilot-icon.png" alt="Copilot" width={18} height={18} className="group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100" />
                        </Link>
                        <Link
                            href="/explore"
                            className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors"
                        >
                            Explore
                        </Link>
                        <Link
                            href="/docs"
                            className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors"
                        >
                            Docs
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-sm text-[var(--var(--kit-text-muted)] hover:text-white transition-colors"
                        >
                            Pricing
                        </Link>
                    </div>

                    {/* Auth Buttons / User Menu */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/settings"
                                    className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors"
                                >
                                    Settings
                                </Link>
                                <div className="flex items-center gap-2 pl-3 border-l border-[var(--kit-border)]">
                                    <Link
                                        href={`/${user.username}`}
                                        className="flex items-center gap-2 text-sm text-white hover:text-orange-400 transition-colors"
                                    >
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                                {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium">{user.displayName || user.username}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs text-[var(--kit-text-muted)] hover:text-red-400 transition-colors ml-1"
                                        title="Sign out"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors px-4 py-2"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/register"
                                    className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/25"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden text-[var(--kit-text-muted)] hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden glass border-t border-[var(--kit-border)]">
                    <div className="px-4 py-4 space-y-3">
                        {/* Mobile Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--kit-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-all text-sm"
                            />
                        </div>

                        <Link href="/copilot" className="flex items-center gap-2 text-sm text-[var(--kit-text)] hover:text-white mb-2 pb-2 border-b border-[var(--kit-border)]/50">
                            <Image src="/copilot-icon.png" alt="Copilot" width={16} height={16} className="opacity-80" />
                            KitBot Copilot
                        </Link>
                        <Link href="/explore" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Explore</Link>
                        <Link href="/docs" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Docs</Link>
                        <Link href="/pricing" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Pricing</Link>
                        <hr className="border-[var(--kit-border)]" />
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 py-2">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                            {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm text-white">{user.displayName || user.username}</span>
                                </div>
                                <Link href="/dashboard" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Dashboard</Link>
                                <Link href="/settings" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Settings</Link>
                                <Link href={`/${user.username}`} className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Profile</Link>
                                <button onClick={handleLogout} className="block w-full text-left text-sm text-[var(--kit-text-muted)] hover:text-red-400">Sign out</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Sign in</Link>
                                <Link href="/register" className="block text-sm bg-orange-600 text-white text-center px-4 py-2 rounded-lg">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
