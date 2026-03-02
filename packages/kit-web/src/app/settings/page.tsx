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

type AiProvider = "google" | "openrouter";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [form, setForm] = useState({ displayName: "", bio: "", avatarUrl: "" });
    const [aiProvider, setAiProvider] = useState<AiProvider>("google");
    const [googleApiKey, setGoogleApiKey] = useState("");
    const [openRouterApiKey, setOpenRouterApiKey] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Kit Keys state
    const [keyName, setKeyName] = useState("");
    const [newKey, setNewKey] = useState<string | null>(null);
    const [keyCopied, setKeyCopied] = useState(false);
    const [isCreatingKey, setIsCreatingKey] = useState(false);

    const updateProfileMutation = useMutation(api.users.updateProfile);
    const createKitKeyMutation = useMutation(api.users.createKitKey);
    const deleteKitKeyMutation = useMutation(api.users.deleteKitKey);

    // Load Kit Keys
    const keys = useQuery(api.users.listKitKeys, user ? { userId: user.id as Id<"users"> } : "skip");

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
        const savedProvider = localStorage.getItem("kit_ai_provider");
        if (savedProvider === "openrouter" || savedProvider === "google") {
            setAiProvider(savedProvider);
        }
        // Load AI provider keys from localStorage
        setGoogleApiKey(localStorage.getItem("kit_google_api_key") || "");
        setOpenRouterApiKey(localStorage.getItem("kit_openrouter_api_key") || "");
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

            // Save AI provider settings and keys
            localStorage.setItem("kit_ai_provider", aiProvider);
            if (googleApiKey) {
                localStorage.setItem("kit_google_api_key", googleApiKey);
            } else {
                localStorage.removeItem("kit_google_api_key");
            }
            if (openRouterApiKey) {
                localStorage.setItem("kit_openrouter_api_key", openRouterApiKey);
            } else {
                localStorage.removeItem("kit_openrouter_api_key");
            }

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

    const handleCreateKey = async () => {
        if (!user || !keyName.trim()) return;

        setIsCreatingKey(true);
        setMessage("");

        try {
            const result = await createKitKeyMutation({
                userId: user.id as Id<"users">,
                name: keyName.trim(),
            });

            if (result && "rawToken" in result) {
                setNewKey(result.rawToken);
                setKeyName("");
            }
        } catch (err: any) {
            setMessage(err.message || "Failed to create key");
        } finally {
            setIsCreatingKey(false);
        }
    };

    const handleDeleteKey = async (keyId: Id<"kitKeys">) => {
        if (!user) return;

        if (!confirm("Are you sure? This will revoke the key immediately.")) return;

        try {
            await deleteKitKeyMutation({ keyId });
            setMessage("Key revoked successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err: any) {
            setMessage(err.message || "Failed to revoke key");
        }
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

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-5 mb-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById("avatar-upload")?.click()}>
                            {form.avatarUrl ? (
                                <img
                                    src={form.avatarUrl}
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-[var(--kit-border)] group-hover:ring-orange-500/50 transition-all"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-3xl ring-2 ring-[var(--kit-border)] group-hover:ring-orange-500/50 transition-all">
                                    {form.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                                </div>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                        setMessage("Image must be under 5MB");
                                        return;
                                    }
                                    // Resize via canvas to stay under Convex 1MiB field limit
                                    const img = new window.Image();
                                    img.onload = () => {
                                        const MAX = 256;
                                        let w = img.width, h = img.height;
                                        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                                        else { w = Math.round(w * MAX / h); h = MAX; }
                                        const canvas = document.createElement("canvas");
                                        canvas.width = w;
                                        canvas.height = h;
                                        const ctx = canvas.getContext("2d")!;
                                        ctx.drawImage(img, 0, 0, w, h);
                                        const compressed = canvas.toDataURL("image/jpeg", 0.8);
                                        setForm({ ...form, avatarUrl: compressed });
                                    };
                                    img.src = URL.createObjectURL(file);
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="text-white font-medium">{form.displayName || user.username}</div>
                            <div className="text-sm text-[var(--kit-text-muted)] mb-2">@{user.username}</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById("avatar-upload")?.click()}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white hover:border-orange-500/50 transition-all"
                                >
                                    Upload photo
                                </button>
                                {form.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, avatarUrl: "" })}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-[var(--kit-text-muted)] mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
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
                {/* KitBot API Key */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-2">KitBot AI</h2>
                    <p className="text-sm text-[var(--kit-text-muted)] mb-4">
                        Configure your AI provider. Keys are stored locally in your browser and never sent to our database.
                    </p>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Default AI Provider</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAiProvider("google")}
                                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${aiProvider === "google"
                                    ? "border-orange-500 bg-orange-500/10 text-white"
                                    : "border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white hover:border-orange-500/40"
                                    }`}
                            >
                                Google Gemini
                            </button>
                            <button
                                type="button"
                                onClick={() => setAiProvider("openrouter")}
                                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${aiProvider === "openrouter"
                                    ? "border-orange-500 bg-orange-500/10 text-white"
                                    : "border-[var(--kit-border)] text-[var(--kit-text-muted)] hover:text-white hover:border-orange-500/40"
                                    }`}
                            >
                                OpenRouter
                            </button>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Google API Key</label>
                        <input
                            type="password"
                            value={googleApiKey}
                            onChange={(e) => setGoogleApiKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm"
                            placeholder="AIzaSy..."
                        />
                        <p className="text-xs text-[var(--kit-text-muted)] mt-2">
                            Get your free API key from{" "}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
                                Google AI Studio
                            </a>
                            .
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">OpenRouter API Key</label>
                        <input
                            type="password"
                            value={openRouterApiKey}
                            onChange={(e) => setOpenRouterApiKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors font-mono text-sm"
                            placeholder="sk-or-v1-..."
                        />
                        <p className="text-xs text-[var(--kit-text-muted)] mt-2">
                            Get your API key from{" "}
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
                                OpenRouter
                            </a>
                            .
                        </p>
                    </div>
                </div>


                {/* Kit Keys */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-2">🔑 Kit Keys</h2>
                    <p className="text-sm text-[var(--kit-text-muted)] mb-6">
                        CLI authentication tokens for pushing/pulling from the terminal.
                    </p>

                    {/* Keys list */}
                    <div className="space-y-3 mb-6">
                        {keys === undefined ? (
                            <div className="text-sm text-[var(--kit-text-muted)]">Loading keys...</div>
                        ) : keys.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-[var(--kit-border)] rounded-xl">
                                <div className="text-2xl mb-2">🔑</div>
                                <p className="text-sm text-[var(--kit-text-muted)]">No keys yet. Create one to authenticate with the CLI.</p>
                            </div>
                        ) : (
                            keys.map((key) => (
                                <div key={key.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--kit-border)] bg-[var(--kit-surface)] group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center">
                                            <span className="text-lg">🔑</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{key.name}</div>
                                            <div className="text-xs text-[var(--kit-text-muted)]">
                                                Created: {new Date(key.createdAt).toLocaleDateString()} • Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteKey(key.id)}
                                        className="opacity-0 group-hover:opacity-100 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Create Key Form */}
                    <div className="border-t border-[var(--kit-border)] pt-4">
                        <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Create New Key</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="e.g. My Laptop, CI/CD"
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors text-sm"
                            />
                            <button
                                onClick={handleCreateKey}
                                disabled={!keyName.trim() || isCreatingKey}
                                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingKey ? "Creating..." : "Generate Key"}
                            </button>
                        </div>
                        {newKey && (
                            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-400">✓ Key created! Save it now:</span>
                                    <button
                                        onClick={() => { setKeyCopied(true); navigator.clipboard.writeText(newKey); setTimeout(() => setKeyCopied(false), 2000); }}
                                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    >
                                        {keyCopied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <code className="block text-xs bg-[#0a0a0f] px-3 py-2 rounded font-mono text-green-400 break-all select-all">
                                    {newKey}
                                </code>
                                <button
                                    onClick={() => setNewKey(null)}
                                    className="mt-2 text-xs text-[var(--kit-text-muted)] hover:text-white"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
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
        </div >
    );
}

