"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<"verify" | "success">("verify");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const resetPassword = useMutation(api.users.resetPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({ username, email, newPassword });
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-16">
                <div className="w-full max-w-md text-center">
                    <div className="glass rounded-2xl p-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                        <p className="text-sm text-[var(--kit-text-muted)] mb-6">
                            Your password has been updated successfully. You can now sign in with your new password.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/25 text-center"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                    <p className="text-sm text-[var(--kit-text-muted)] mt-2">
                        Verify your identity to set a new password
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
                    {error && (
                        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-300">
                            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Enter the username and email address associated with your account to reset your password.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="your-username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <hr className="border-[var(--kit-border)]" />

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            placeholder="••••••••"
                            required
                            minLength={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:ring-1 transition-colors ${confirmPassword && confirmPassword !== newPassword
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "border-[var(--kit-border)] focus:border-orange-500 focus:ring-orange-500"
                                }`}
                            placeholder="••••••••"
                            required
                            minLength={4}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !email || !newPassword || newPassword !== confirmPassword}
                        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="text-center text-sm text-[var(--kit-text-muted)] mt-6">
                    Remember your password?{" "}
                    <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
