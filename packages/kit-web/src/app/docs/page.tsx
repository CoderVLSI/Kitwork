"use client";

import Link from "next/link";
import { useState } from "react";

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("getting-started");

    const sections = [
        { id: "getting-started", title: "Getting Started", icon: "🚀" },
        { id: "cli-commands", title: "CLI Commands", icon: "⌨️" },
        { id: "workflow", title: "Workflow", icon: "🔄" },
        { id: "api", title: "API Reference", icon: "📡" },
    ];

    const content = {
        "getting-started": (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Getting Started with Kitwork</h2>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
                    <div className="bg-[var(--kit-bg)] rounded-xl p-4 code-font text-sm text-[var(--kit-text-muted)] space-y-2">
                        <div># Install via npm</div>
                        <div><span className="text-green-400">$</span> npm install -g kitwork</div>
                        <div className="mt-3"># Verify installation</div>
                        <div><span className="text-green-400">$</span> kit --version</div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Initialize a Repository</h3>
                    <div className="bg-[var(--kit-bg)] rounded-xl p-4 code-font text-sm text-[var(--kit-text-muted)] space-y-2">
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> init</div>
                        <div className="text-green-400">✓ Initialized empty Kitwork repository in .kit</div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Your First Commit</h3>
                    <div className="bg-[var(--kit-bg)] rounded-xl p-4 code-font text-sm text-[var(--kit-text-muted)] space-y-2">
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> add .</div>
                        <div className="text-green-400">✓ Staged 3 file(s)</div>
                        <div className="mt-2"><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> commit -m "Initial commit"</div>
                        <div className="text-green-400">✓ [a1b2c3d4] Initial commit</div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Create a Remote</h3>
                    <p className="text-sm text-[var(--kit-text-muted)] mb-3">
                        First, create an account on the web interface, then add a remote:
                    </p>
                    <div className="bg-[var(--kit-bg)] rounded-xl p-4 code-font text-sm text-[var(--kit-text-muted)] space-y-2">
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> remote add origin <span className="text-purple-300">https://kitwork.dev/user/repo</span></div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Push Your Code</h3>
                    <div className="bg-[var(--kit-bg)] rounded-xl p-4 code-font text-sm text-[var(--kit-text-muted)] space-y-2">
                        <div><span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> push origin main</div>
                        <div className="text-green-400">✓ Pushed main → origin</div>
                    </div>
                </div>
            </div>
        ),

        "cli-commands": (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">CLI Commands</h2>

                {[
                    {
                        cmd: "kit init",
                        desc: "Initialize a new Kitwork repository in the current directory",
                    },
                    {
                        cmd: "kit add <files>",
                        desc: "Stage files for commit (use . for all files)",
                    },
                    {
                        cmd: "kit commit -m <message>",
                        desc: "Create a new commit with staged changes",
                    },
                    {
                        cmd: "kit status",
                        desc: "Show the working tree status",
                    },
                    {
                        cmd: "kit log",
                        desc: "Show commit history",
                    },
                    {
                        cmd: "kit branch",
                        desc: "List, create, or delete branches",
                    },
                    {
                        cmd: "kit checkout <branch>",
                        desc: "Switch to a different branch",
                    },
                    {
                        cmd: "kit merge <branch>",
                        desc: "Merge changes from another branch",
                    },
                    {
                        cmd: "kit remote add <name> <url>",
                        desc: "Add a new remote repository",
                    },
                    {
                        cmd: "kit push <remote> <branch>",
                        desc: "Push commits to a remote repository",
                    },
                    {
                        cmd: "kit pull <remote> <branch>",
                        desc: "Fetch and merge changes from a remote",
                    },
                    {
                        cmd: "kit clone <url>",
                        desc: "Clone a remote repository",
                    },
                    {
                        cmd: "kit diff",
                        desc: "Show changes between commits or branches",
                    },
                ].map((item, i) => (
                    <div key={i} className="glass rounded-xl p-4">
                        <code className="text-sm code-font text-purple-400 bg-purple-400/10 px-2 py-1 rounded">{item.cmd}</code>
                        <p className="text-sm text-[var(--kit-text-muted)] mt-2">{item.desc}</p>
                    </div>
                ))}
            </div>
        ),

        "workflow": (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Typical Workflow</h2>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">1. Start a New Feature</h3>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)] space-y-1">
                        <div><span className="text-cyan-300">kit</span> checkout -b feature/new-feature</div>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">2. Make and Commit Changes</h3>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)] space-y-1">
                        <div><span className="text-cyan-300">kit</span> add .</div>
                        <div><span className="text-cyan-300">kit</span> commit -m "Add new feature"</div>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">3. Push to Remote</h3>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)] space-y-1">
                        <div><span className="text-cyan-300">kit</span> push origin feature/new-feature</div>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">4. Merge to Main</h3>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)] space-y-1">
                        <div><span className="text-cyan-300">kit</span> checkout main</div>
                        <div><span className="text-cyan-300">kit</span> merge feature/new-feature</div>
                        <div><span className="text-cyan-300">kit</span> push origin main</div>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">5. Clean Up</h3>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)] space-y-1">
                        <div><span className="text-cyan-300">kit</span> branch -d feature/new-feature</div>
                    </div>
                </div>
            </div>
        ),

        "api": (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">API Reference</h2>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Repository Endpoints</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-[var(--kit-border)]">
                            <div>
                                <code className="text-sm code-font text-purple-400">GET /repos</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">List all repositories</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/20 text-green-400">Public</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[var(--kit-border)]">
                            <div>
                                <code className="text-sm code-font text-purple-400">GET /repos/:owner/:name</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Get repository details</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/20 text-green-400">Public</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[var(--kit-border)]">
                            <div>
                                <code className="text-sm code-font text-purple-400">POST /repos</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Create a new repository</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-yellow-400/20 text-yellow-400">Auth</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <code className="text-sm code-font text-purple-400">DELETE /repos/:owner/:name</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Delete a repository</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-red-400/20 text-red-400">Owner</span>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Authentication</h3>
                    <p className="text-sm text-[var(--kit-text-muted)] mb-3">
                        Include your JWT token in the Authorization header:
                    </p>
                    <div className="bg-[var(--kit-bg)] rounded-lg p-3 code-font text-sm text-[var(--kit-text-muted)]">
                        Authorization: Bearer <span className="text-purple-400">&lt;your-token&gt;</span>
                    </div>
                </div>

                <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Object Endpoints</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-[var(--kit-border)]">
                            <div>
                                <code className="text-sm code-font text-purple-400">GET /repos/:owner/:name/git/blobs/:sha</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Get a blob object</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/20 text-green-400">Public</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[var(--kit-border)]">
                            <div>
                                <code className="text-sm code-font text-purple-400">GET /repos/:owner/:name/git/trees/:sha</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Get a tree object</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/20 text-green-400">Public</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <code className="text-sm code-font text-purple-400">GET /repos/:owner/:name/git/commits/:sha</code>
                                <p className="text-xs text-[var(--kit-text-muted)] mt-1">Get a commit object</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/20 text-green-400">Public</span>
                        </div>
                    </div>
                </div>
            </div>
        ),
    };

    return (
        <div className="min-h-screen pt-20">
            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden md:block w-64 fixed left-0 top-16 bottom-0 border-r border-[var(--kit-border)] bg-[var(--kit-bg)]/50 p-4 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-[var(--kit-text-muted)] uppercase tracking-wider mb-3 px-3">Documentation</h3>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                    activeSection === section.id
                                        ? "bg-purple-500/20 text-white font-medium"
                                        : "text-[var(--kit-text-muted)] hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <span>{section.icon}</span>
                                {section.title}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-8 px-3">
                        <Link
                            href="/register"
                            className="block w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium text-center transition-all"
                        >
                            Get Started
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Mobile Nav */}
                        <div className="md:hidden mb-6">
                            <select
                                value={activeSection}
                                onChange={(e) => setActiveSection(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white"
                            >
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.icon} {section.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Content */}
                        <div className="glass rounded-2xl p-6 md:p-8">
                            {content[activeSection as keyof typeof content]}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
