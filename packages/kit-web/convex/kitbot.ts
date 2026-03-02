import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

type TreeEntry = {
    mode: string;
    type: "tree" | "blob";
    hash: string;
    name: string;
};

function decodeObject(base64Data: string): string {
    const raw = Buffer.from(base64Data, "base64").toString();
    const nullIndex = raw.indexOf("\0");
    return nullIndex === -1 ? raw : raw.slice(nullIndex + 1);
}

function parseTreeEntries(treeText: string): TreeEntry[] {
    return treeText
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            const name = nameParts.join(" ");
            return {
                mode,
                type: (type === "tree" ? "tree" : "blob") as "tree" | "blob",
                hash,
                name,
            };
        });
}

async function getObjectByHash(ctx: any, repoId: any, hash: string) {
    return ctx.db
        .query("objects")
        .withIndex("by_repo_hash", (q: any) => q.eq("repoId", repoId).eq("hash", hash))
        .first();
}

async function getCommitTreeHash(ctx: any, repoId: any, commitHash: string): Promise<string | null> {
    const commitObj = await getObjectByHash(ctx, repoId, commitHash);
    if (!commitObj) return null;

    const commitText = decodeObject(commitObj.data);
    const treeMatch = commitText.match(/^tree ([0-9a-fA-F]+)/m);
    return treeMatch ? treeMatch[1] : null;
}

async function buildBlobMap(
    ctx: any,
    repoId: any,
    treeHash: string,
    prefix = "",
    out: Record<string, string> = {}
): Promise<Record<string, string>> {
    const treeObj = await getObjectByHash(ctx, repoId, treeHash);
    if (!treeObj) return out;

    const treeText = decodeObject(treeObj.data);
    const entries = parseTreeEntries(treeText);

    for (const entry of entries) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.type === "tree") {
            await buildBlobMap(ctx, repoId, entry.hash, path, out);
        } else {
            out[path] = entry.hash;
        }
    }

    return out;
}

// List files in a directory
export const listFiles = query({
    args: {
        username: v.string(),
        repoName: v.string(),
        path: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();
        if (!branchRef) {
            return {
                entries: [],
                path: args.path || "",
                branch: repo.defaultBranch || "main",
                empty: true,
                message: "Repository has no commits yet.",
            };
        }

        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return { error: "Commit not found" };

        const commitText = Buffer.from(commitObj.data, "base64").toString();
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { error: "Invalid commit" };

        let currentTreeHash = treeMatch[1];
        const pathParts = (args.path || "").split("/").filter(Boolean);

        for (const part of pathParts) {
            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", currentTreeHash)
                )
                .first();
            if (!treeObj) return { error: `Path not found: ${args.path}` };

            const treeText = Buffer.from(treeObj.data, "base64").toString();
            const lines = treeText.trim().split("\n").filter(Boolean);
            const next = lines.find((line) => {
                const [, type, , ...nameParts] = line.split(" ");
                return type === "tree" && nameParts.join(" ") === part;
            });

            if (!next) return { error: `Directory not found: ${args.path}` };
            const [, , hash] = next.split(" ");
            currentTreeHash = hash;
        }

        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", currentTreeHash)
            )
            .first();
        if (!treeObj) return { error: "Tree not found" };

        const treeText = Buffer.from(treeObj.data, "base64").toString();
        const entries = treeText
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => {
                const [mode, type, hash, ...nameParts] = line.split(" ");
                const name = nameParts.join(" ");
                return { name, type, mode, hash };
            })
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
                return a.name.localeCompare(b.name);
            });

        return { entries, path: args.path || "", branch: repo.defaultBranch || "main" };
    },
});

// Read a file's content
export const readFile = query({
    args: {
        username: v.string(),
        repoName: v.string(),
        path: v.string(),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        // Navigate to the file through the tree structure
        const pathParts = args.path.split("/").filter(Boolean);

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        if (!branchRef) return { error: "Branch not found" };

        // Get commit and extract tree hash
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();

        if (!commitObj) return { error: "Commit not found" };

        const commitText = Buffer.from(commitObj.data, "base64").toString();
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { error: "Invalid commit" };

        let currentTreeHash = treeMatch[1];

        // Navigate through path
        for (let i = 0; i < pathParts.length - 1; i++) {
            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", currentTreeHash)
                )
                .first();

            if (!treeObj) return { error: `Path not found: ${args.path}` };

            const treeText = Buffer.from(treeObj.data, "base64").toString();
            const lines = treeText.trim().split("\n").filter(Boolean);

            let found = false;
            for (const line of lines) {
                const [mode, type, hash, ...nameParts] = line.split(" ");
                const name = nameParts.join(" ");
                if (name === pathParts[i] && type === "tree") {
                    currentTreeHash = hash;
                    found = true;
                    break;
                }
            }

            if (!found) return { error: `Path not found: ${args.path}` };
        }

        // Now get the final file/blob
        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", currentTreeHash)
            )
            .first();

        if (!treeObj) return { error: "Tree not found" };

        const treeText = Buffer.from(treeObj.data, "base64").toString();
        const lines = treeText.trim().split("\n").filter(Boolean);

        const targetName = pathParts[pathParts.length - 1] || pathParts[0];
        let blobHash: string | null = null;

        for (const line of lines) {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            const name = nameParts.join(" ");
            if (name === targetName && type === "blob") {
                blobHash = hash;
                break;
            }
        }

        if (!blobHash) return { error: `File not found: ${args.path}` };

        // Get the blob content
        const blobObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", blobHash)
            )
            .first();

        if (!blobObj) return { error: "Blob not found" };

        const content = Buffer.from(blobObj.data, "base64").toString();

        return { content };
    },
});

// Write/create a file
export const writeFile = mutation({
    args: {
        username: v.string(),
        repoName: v.string(),
        path: v.string(),
        content: v.string(),
        message: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };
        if (repo.ownerId !== args.userId) return { error: "Not authorized" };

        // Legacy fallback: tool route performs real commit flow via repos.createFile.
        const blobHash = `blob-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        await ctx.db.insert("objects", {
            repoId: repo._id,
            hash: blobHash,
            data: Buffer.from(args.content, "utf-8").toString("base64"),
        });

        return {
            success: true,
            hash: blobHash,
            message: `Stored blob for ${args.path}. Use write_file tool endpoint for full commit metadata.`,
        };
    },
});

// Search for text in files
export const search = query({
    args: {
        username: v.string(),
        repoName: v.string(),
        pattern: v.string(),
        filePattern: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();
        if (!branchRef) return { error: "Branch not found" };

        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return { error: "Commit not found" };

        const commitText = Buffer.from(commitObj.data, "base64").toString();
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { error: "Invalid commit" };

        const filePattern = args.filePattern?.trim();
        const matchesPattern = (path: string) => {
            if (!filePattern) return true;
            if (!filePattern.includes("*")) return path.includes(filePattern);

            const escaped = filePattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
            const regex = new RegExp(`^${escaped}$`, "i");
            return regex.test(path);
        };

        const results: Array<{ path: string; line: string; lineNumber: number }> = [];
        let truncated = false;
        const limit = 200;

        const walkTree = async (treeHash: string, prefix: string): Promise<void> => {
            if (results.length >= limit) {
                truncated = true;
                return;
            }

            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", treeHash)
                )
                .first();
            if (!treeObj) return;

            const treeText = Buffer.from(treeObj.data, "base64").toString();
            const lines = treeText.trim().split("\n").filter(Boolean);

            for (const entry of lines) {
                if (results.length >= limit) {
                    truncated = true;
                    return;
                }

                const [, type, hash, ...nameParts] = entry.split(" ");
                const name = nameParts.join(" ");
                const path = prefix ? `${prefix}/${name}` : name;

                if (type === "tree") {
                    await walkTree(hash, path);
                    continue;
                }
                if (type !== "blob" || !matchesPattern(path)) continue;

                const blobObj = await ctx.db
                    .query("objects")
                    .withIndex("by_repo_hash", (q) =>
                        q.eq("repoId", repo._id).eq("hash", hash)
                    )
                    .first();
                if (!blobObj) continue;

                try {
                    const content = Buffer.from(blobObj.data, "base64").toString();
                    const linesInFile = content.split("\n");
                    for (let i = 0; i < linesInFile.length; i++) {
                        if (linesInFile[i].includes(args.pattern)) {
                            results.push({
                                path,
                                line: linesInFile[i].trim(),
                                lineNumber: i + 1,
                            });
                            if (results.length >= limit) {
                                truncated = true;
                                return;
                            }
                        }
                    }
                } catch {
                    // Ignore binary or malformed file contents.
                }
            }
        };

        await walkTree(treeMatch[1], "");
        return { results, count: results.length, truncated };
    },
});

// Commit changes
export const commit = mutation({
    args: {
        username: v.string(),
        repoName: v.string(),
        message: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };
        if (repo.ownerId !== args.userId) return { error: "Not authorized" };

        const branchName = repo.defaultBranch || "main";
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branchName)
            )
            .first();

        if (!branchRef) {
            return { error: "No commits yet. Use write_file first to create an initial commit." };
        }

        const latestCommit = await ctx.db
            .query("commits")
            .withIndex("by_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();

        return {
            success: true,
            noOp: true,
            branch: branchName,
            head: branchRef.commitHash.slice(0, 8),
            message: `No staged changes to commit with "${args.message}". Each write_file call already creates a commit.`,
            latestCommit: latestCommit
                ? {
                    hash: latestCommit.hash.slice(0, 8),
                    message: latestCommit.message,
                    timestamp: latestCommit.timestamp,
                }
                : null,
        };
    },
});
// Create a new branch
export const createBranch = mutation({
    args: {
        username: v.string(),
        repoName: v.string(),
        branch: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };
        if (repo.ownerId !== args.userId) return { error: "Not authorized" };

        const branchName = args.branch.trim();
        if (!branchName) return { error: "Branch name is required" };

        const existing = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branchName)
            )
            .first();

        if (existing) return { error: "Branch already exists" };

        const currentBranch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        if (!currentBranch) return { error: "Cannot create branch before first commit" };

        await ctx.db.insert("branches", {
            repoId: repo._id,
            name: branchName,
            commitHash: currentBranch.commitHash,
        });

        return {
            success: true,
            message: `Branch "${branchName}" created from ${repo.defaultBranch || "main"}`,
            head: currentBranch.commitHash.slice(0, 8),
        };
    },
});
// Switch to a different branch
export const switchBranch = mutation({
    args: {
        username: v.string(),
        repoName: v.string(),
        branch: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };
        if (repo.ownerId !== args.userId) return { error: "Not authorized" };

        const branchName = args.branch.trim();
        if (!branchName) return { error: "Branch name is required" };

        const branch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branchName)
            )
            .first();

        if (!branch) return { error: "Branch not found" };

        if (repo.defaultBranch !== branchName) {
            await ctx.db.patch(repo._id, { defaultBranch: branchName });
        }

        return {
            success: true,
            message: `Switched to branch "${branchName}"`,
            branch: branchName,
            head: branch.commitHash.slice(0, 8),
        };
    },
});
// Get commit log
export const getLog = query({
    args: {
        username: v.string(),
        repoName: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        const commits = await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
            .take(args.limit || 10);

        return {
            commits: commits.map((c) => ({
                hash: c.hash.slice(0, 8),
                message: c.message,
                author: c.author,
                timestamp: c.timestamp,
                branch: c.branch,
            })),
        };
    },
});

// Get working tree status
export const getStatus = query({
    args: {
        username: v.string(),
        repoName: v.string(),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        const branchName = repo.defaultBranch || "main";
        const branch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branchName)
            )
            .first();

        if (!branch) {
            return {
                branch: branchName,
                head: "none",
                status: "clean",
                staged: 0,
                unstaged: 0,
                untracked: 0,
                trackedFiles: 0,
                latestCommit: null,
            };
        }

        const latestCommit = await ctx.db
            .query("commits")
            .withIndex("by_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branch.commitHash)
            )
            .first();

        const treeHash = latestCommit?.treeHash || await getCommitTreeHash(ctx, repo._id, branch.commitHash);
        const trackedFiles = treeHash
            ? Object.keys(await buildBlobMap(ctx, repo._id, treeHash)).length
            : 0;

        return {
            branch: branch.name || branchName,
            head: branch.commitHash.slice(0, 8),
            status: "clean",
            staged: 0,
            unstaged: 0,
            untracked: 0,
            trackedFiles,
            latestCommit: latestCommit
                ? {
                    hash: latestCommit.hash.slice(0, 8),
                    message: latestCommit.message,
                    author: latestCommit.author,
                    timestamp: latestCommit.timestamp,
                    modifiedFiles: latestCommit.modifiedFiles || [],
                }
                : null,
        };
    },
});
// Get diff
export const getDiff = query({
    args: {
        username: v.string(),
        repoName: v.string(),
        path: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.username).eq("name", args.repoName)
            )
            .first();

        if (!repo) return { error: "Repository not found" };

        const branchName = repo.defaultBranch || "main";
        const commits = await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) =>
                q.eq("repoId", repo._id).eq("branch", branchName)
            )
            .collect();

        if (commits.length === 0) {
            return { diff: "No commits found for this branch", hasChanges: false };
        }

        const sorted = commits.sort((a, b) => b.timestamp - a.timestamp);
        const latest = sorted[0];
        const previous = sorted[1];

        const latestTreeHash = latest.treeHash || await getCommitTreeHash(ctx, repo._id, latest.hash);
        if (!latestTreeHash) {
            return { diff: "Unable to load latest tree", hasChanges: false };
        }

        const latestFiles = await buildBlobMap(ctx, repo._id, latestTreeHash);
        const previousTreeHash = previous
            ? (previous.treeHash || await getCommitTreeHash(ctx, repo._id, previous.hash))
            : null;
        const previousFiles = previousTreeHash
            ? await buildBlobMap(ctx, repo._id, previousTreeHash)
            : {};

        const pathFilter = args.path?.trim();
        const includePath = (filePath: string) => (
            !pathFilter || filePath === pathFilter || filePath.startsWith(`${pathFilter}/`)
        );

        const added: string[] = [];
        const removed: string[] = [];
        const modified: string[] = [];

        for (const [filePath, hash] of Object.entries(latestFiles)) {
            if (!includePath(filePath)) continue;
            if (!(filePath in previousFiles)) {
                added.push(filePath);
            } else if (previousFiles[filePath] !== hash) {
                modified.push(filePath);
            }
        }

        for (const filePath of Object.keys(previousFiles)) {
            if (!includePath(filePath)) continue;
            if (!(filePath in latestFiles)) {
                removed.push(filePath);
            }
        }

        added.sort();
        removed.sort();
        modified.sort();

        const hasChanges = added.length + removed.length + modified.length > 0;
        if (!hasChanges) {
            return {
                diff: pathFilter
                    ? `No changes found for "${pathFilter}" between latest commits`
                    : "No file-level changes between latest commits",
                hasChanges: false,
                summary: {
                    branch: branchName,
                    from: previous ? previous.hash.slice(0, 8) : "empty",
                    to: latest.hash.slice(0, 8),
                    added: 0,
                    removed: 0,
                    modified: 0,
                },
            };
        }

        const fromHash = previous ? previous.hash.slice(0, 8) : "empty";
        const toHash = latest.hash.slice(0, 8);
        const maxList = 25;
        const formatGroup = (label: string, files: string[]) => (
            files.length
                ? `${label} (${files.length}):\n${files.slice(0, maxList).map((f) => `  - ${f}`).join("\n")}${files.length > maxList ? `\n  - ...and ${files.length - maxList} more` : ""}`
                : ""
        );

        const sections = [
            `Changes on ${branchName}: ${fromHash} -> ${toHash}`,
            formatGroup("Added", added),
            formatGroup("Modified", modified),
            formatGroup("Removed", removed),
        ].filter(Boolean);

        return {
            diff: sections.join("\n\n"),
            hasChanges,
            summary: {
                branch: branchName,
                from: fromHash,
                to: toHash,
                added: added.length,
                removed: removed.length,
                modified: modified.length,
            },
            files: {
                added: added.slice(0, 100),
                removed: removed.slice(0, 100),
                modified: modified.slice(0, 100),
            },
        };
    },
});
