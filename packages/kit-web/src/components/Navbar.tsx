"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
}

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const stored = localStorage.getItem("kit_user");
            setUser(stored ? JSON.parse(stored) : null);
        };

        checkAuth();

        // Listen for storage changes (for multi-tab sync)
        const handleStorageChange = () => checkAuth();
        window.addEventListener("storage", handleStorageChange);

        // Custom event for login/logout
        const handleAuthChange = () => checkAuth();
        window.addEventListener("auth-change", handleAuthChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("kit_user");
        setUser(null);
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/25">
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

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
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
                            className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors"
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
                                <div className="flex items-center gap-2 pl-3 border-l border-[var(--kit-border)]">
                                    <Link
                                        href={`/${user.username}`}
                                        className="flex items-center gap-2 text-sm text-white hover:text-orange-400 transition-colors"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                            {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                                        </div>
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
                        <Link href="/explore" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Explore</Link>
                        <Link href="/docs" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Docs</Link>
                        <Link href="/pricing" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Pricing</Link>
                        <hr className="border-[var(--kit-border)]" />
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 py-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                        {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-white">{user.displayName || user.username}</span>
                                </div>
                                <Link href="/dashboard" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Dashboard</Link>
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
