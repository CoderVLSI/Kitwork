"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
}

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [form, setForm] = useState({ displayName: "", bio: "", avatarUrl: "" });
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const updateProfileMutation = useMutation(api.users.updateProfile);

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (!stored) {
            window.location.href = "/login";
            return;
        }
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setForm({
            displayName: parsed.displayName || "",
            bio: parsed.bio || "",
            avatarUrl: parsed.avatarUrl || "",
        });
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setMessage("");

        try {
            await updateProfileMutation({
                userId: user.id as Id<"users">,
                displayName: form.displayName || undefined,
                bio: form.bio || undefined,
                avatarUrl: form.avatarUrl || undefined,
            });

            // Update local storage
            const updated = { ...user, ...form };
            localStorage.setItem("kit_user", JSON.stringify(updated));
            setUser(updated);

            setMessage("Profile updated successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err: any) {
            setMessage(err.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("kit_user");
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/";
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-[var(--kit-text-muted)]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-sm text-[var(--kit-text-muted)]">Manage your profile and preferences</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg glass text-[var(--kit-text-muted)] text-sm hover:text-red-400 hover:border-red-400/30 transition-all"
                    >
                        Sign out
                    </button>
                </div>

                {/* Profile Section */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Profile</h2>

                    {/* Avatar Preview */}
                    <div className="flex items-center gap-4 mb-6">
                        {form.avatarUrl ? (
                            <img
                                src={form.avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-2xl">
                                {form.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className="text-white font-medium">{form.displayName || user.username}</div>
                            <div className="text-sm text-[var(--kit-text-muted)]">@{user.username}</div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Display Name</label>
                            <input
                                type="text"
                                value={form.displayName}
                                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                placeholder="Your Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Bio</label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Avatar URL</label>
                            <input
                                type="url"
                                value={form.avatarUrl}
                                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                placeholder="https://example.com/avatar.png"
                            />
                            <p className="text-xs text-[var(--kit-text-muted)] mt-1">
                                Enter a URL for your avatar image
                            </p>
                        </div>

                        {message && (
                            <div className={`text-sm px-4 py-2 rounded-lg ${message.includes("success") ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                                {message}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <Link
                                href={`/${user.username}`}
                                className="px-6 py-3 rounded-xl glass text-[var(--kit-text-muted)] hover:text-white transition-all"
                            >
                                View Profile
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-[var(--kit-border)]">
                            <span className="text-[var(--kit-text-muted)]">Username</span>
                            <span className="text-white">@{user.username}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--kit-border)]">
                            <span className="text-[var(--kit-text-muted)]">Email</span>
                            <span className="text-white">{user.email}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-[var(--kit-text-muted)]">Member since</span>
                            <span className="text-white">2026</span>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="glass rounded-2xl p-6 mt-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
                    <div className="space-y-2">
                        <Link href="/dashboard" className="block py-2 text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors">
                            → Dashboard
                        </Link>
                        <Link href="/docs" className="block py-2 text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors">
                            → Documentation
                        </Link>
                        <a href="https://github.com" className="block py-2 text-sm text-[var(--kit-text-muted)] hover:text-white transition-colors">
                            → GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
