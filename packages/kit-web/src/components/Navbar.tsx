"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-transform">
                            K
                        </div>
                        <span className="text-lg font-bold text-white">
                            Kit<span className="text-purple-400">work</span>
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

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors px-4 py-2"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
                        >
                            Get Started
                        </Link>
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
                        <Link href="/login" className="block text-sm text-[var(--kit-text-muted)] hover:text-white">Sign in</Link>
                        <Link href="/register" className="block text-sm bg-purple-600 text-white text-center px-4 py-2 rounded-lg">Get Started</Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
