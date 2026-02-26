"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export default function RegisterPage() {
    const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const registerMutation = useMutation(api.users.register);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await registerMutation({
                username: form.username,
                email: form.email,
                password: form.password,
                displayName: form.displayName || undefined,
            });
            localStorage.setItem("kit_user", JSON.stringify(user));
            window.dispatchEvent(new Event("auth-change"));
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Image
                                src="/mascot.png"
                                alt="Kitwork Mascot"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-sm text-[var(--kit-text-muted)] mt-2">Join the Kitwork community</p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
                    {error && (
                        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Username</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="cool-dev"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Display Name</label>
                        <input
                            type="text"
                            value={form.displayName}
                            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Password</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center text-sm text-[var(--kit-text-muted)] mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
