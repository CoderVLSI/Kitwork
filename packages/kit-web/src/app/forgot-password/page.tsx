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
            <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[160px]" />
                </div>
                <div className="w-full max-w-md text-center relative z-10">
                    <div className="glass-glow rounded-2xl p-8 animate-fade-in-up">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--kit-green)]/15 border border-[var(--kit-green)]/25 flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-[var(--kit-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                        <p className="text-sm text-[var(--kit-text-muted)] mb-6">
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/25 text-center"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[160px]" />
                <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[140px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 mb-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                            <Image src="/mascot.png" alt="Kitwork Mascot" width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                    <p className="text-sm text-[var(--kit-text-muted)] mt-2">
                        Verify your identity to set a new password
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass-glow rounded-2xl p-8 space-y-5 animate-fade-in-up delay-1">
                    {error && (
                        <div className="text-sm text-[var(--kit-red)] bg-[var(--kit-red)]/10 border border-[var(--kit-red)]/20 rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-[var(--kit-indigo)]/10 border border-[var(--kit-indigo)]/20">
                        <p className="text-xs text-indigo-300">
                            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Enter the username and email associated with your account.
                        </p>
                    </div>

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
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-dim)] transition-all"
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
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-dim)] transition-all"
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
                            className={`w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border text-white placeholder:text-[var(--kit-text-dim)] transition-all ${confirmPassword && confirmPassword !== newPassword
                                ? "border-[var(--kit-red)]"
                                : "border-[var(--kit-border)]"
                                }`}
                            placeholder="••••••••"
                            required
                            minLength={4}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-[var(--kit-red)] mt-1.5">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !email || !newPassword || newPassword !== confirmPassword}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="text-center text-sm text-[var(--kit-text-muted)] mt-6 animate-fade-in-up delay-2">
                    Remember your password?{" "}
                    <Link href="/login" className="text-[var(--kit-primary)] hover:text-[var(--kit-amber)] transition-colors font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
