"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface User { id: string; username: string; email: string; displayName: string; }

export default function RepoSettingsPage({ params }: { params: Promise<{ username: string; repo: string }> }) {
    const rawParams = use(params);
    const username = decodeURIComponent(rawParams.username);
    const repoName = decodeURIComponent(rawParams.repo);
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [defaultBranch, setDefaultBranch] = useState("main");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const repoInfo = useQuery(api.repos.get, { ownerUsername: username, name: repoName });
    const updateSettings = useMutation(api.repos.updateSettings);
    const deleteRepo = useMutation(api.repos.deleteRepo);

    useEffect(() => {
        const stored = localStorage.getItem("kit_user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    useEffect(() => {
        if (repoInfo) {
            setName(repoInfo.name);
            setDescription(repoInfo.description || "");
            setIsPublic(repoInfo.isPublic);
            setDefaultBranch(repoInfo.defaultBranch || "main");
        }
    }, [repoInfo]);

    if (repoInfo === undefined) return <div className="min-h-screen flex items-center justify-center pt-16"><div className="text-[var(--kit-text-muted)]">Loading...</div></div>;
    if (repoInfo === null) return <div className="min-h-screen flex items-center justify-center pt-16"><div className="text-center"><div className="text-4xl mb-4">😕</div><h2 className="text-xl font-bold text-white mb-2">Repository not found</h2></div></div>;

    const isOwner = user?.username === username;
    if (!isOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-sm text-[var(--kit-text-muted)]">Only the repository owner can access settings.</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            await updateSettings({
                ownerUsername: username,
                repoName,
                name: name.trim(),
                description: description.trim(),
                isPublic,
                defaultBranch,
                requesterId: user.id as Id<"users">,
            });

            setMessage({ type: "success", text: "Settings updated successfully!" });

            // If repo name changed, redirect to new URL
            if (name.trim() !== repoName) {
                setTimeout(() => {
                    router.push(`/${username}/${name.trim()}/settings`);
                }, 1000);
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update settings" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || deleteConfirmText !== repoName) return;

        setIsDeleting(true);
        setMessage(null);

        try {
            await deleteRepo({
                ownerUsername: username,
                repoName,
                requesterId: user.id as Id<"users">,
            });

            setMessage({ type: "success", text: "Repository deleted successfully!" });

            setTimeout(() => {
                router.push(`/${username}`);
            }, 1000);
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to delete repository" });
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-[var(--kit-text-muted)] mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <span className="hover:text-orange-400 cursor-pointer" onClick={() => router.push(`/${username}/${repoName}`)}>{username}</span>
                        <span>/</span>
                        <span className="hover:text-orange-400 cursor-pointer" onClick={() => router.push(`/${username}/${repoName}`)}>{repoName}</span>
                        <span>/</span>
                        <span className="text-white font-medium">Settings</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Repository Settings</h1>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Settings */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Basic Settings</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Repository Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors resize-none h-24"
                                    placeholder="Add a description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--kit-text-muted)] mb-2">Default Branch</label>
                                <input
                                    type="text"
                                    value={defaultBranch}
                                    onChange={(e) => setDefaultBranch(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Visibility</h2>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 rounded-lg border border-[var(--kit-border)] cursor-pointer hover:border-orange-500/50 transition-colors">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={isPublic}
                                    onChange={() => setIsPublic(true)}
                                    className="w-4 h-4 accent-orange-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-white">Public</div>
                                    <div className="text-sm text-[var(--kit-text-muted)]">Anyone can see this repository</div>
                                </div>
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border border-[var(--kit-border)] cursor-pointer hover:border-orange-500/50 transition-colors">
                                <input
                                    type="radio"
                                    name="visibility"
                                    checked={!isPublic}
                                    onChange={() => setIsPublic(false)}
                                    className="w-4 h-4 accent-orange-500"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-white">Private</div>
                                    <div className="text-sm text-[var(--kit-text-muted)]">Only you can see this repository</div>
                                </div>
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </label>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="glass rounded-xl p-6 border border-red-500/30">
                        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                            >
                                Delete this repository
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--kit-text-muted)]">
                                    To confirm deletion, type the repository name <code className="text-orange-400">{repoName}</code>:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--kit-bg)] border border-red-500/50 text-white placeholder:text-[var(--kit-text-muted)] focus:outline-none focus:border-red-500 transition-colors"
                                    placeholder={repoName}
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleteConfirmText !== repoName || isDeleting}
                                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? "Deleting..." : "Yes, delete this repository"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                        className="px-4 py-2 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white text-sm font-medium transition-colors"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(`/${username}/${repoName}`)}
                            className="px-6 py-2.5 rounded-lg glass text-[var(--kit-text-muted)] hover:text-white text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
