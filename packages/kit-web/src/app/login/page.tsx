"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const loginMutation = useMutation(api.users.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await loginMutation({ username, password });
            localStorage.setItem("kit_user", JSON.stringify(user));
            window.dispatchEvent(new Event("auth-change"));
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/6 rounded-full blur-[160px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[140px]" />
                <div className="absolute top-1/3 right-[20%] w-12 h-12 border border-orange-500/10 rounded-lg rotate-45 animate-float" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 mb-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Image src="/mascot.png" alt="Kitwork Mascot" width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Sign in to Kitwork</h1>
                    <p className="text-sm text-[var(--kit-text-muted)] mt-2">Welcome back!</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-glow rounded-2xl p-8 space-y-5 animate-fade-in-up delay-1">
                    {error && (
                        <div className="text-sm text-[var(--kit-red)] bg-[var(--kit-red)]/10 border border-[var(--kit-red)]/20 rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-dim)] transition-all"
                            placeholder="your-username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-dim)] transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs text-[var(--kit-primary)] hover:text-[var(--kit-amber)] transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-[var(--kit-text-muted)] mt-6 animate-fade-in-up delay-2">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-[var(--kit-primary)] hover:text-[var(--kit-amber)] transition-colors font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
