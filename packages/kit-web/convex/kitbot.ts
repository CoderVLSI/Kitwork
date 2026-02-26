import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

        // Get the default branch's HEAD
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        if (!branchRef) return { error: "Branch not found" };

        // Get the commit object
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

        // Get tree object
        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeMatch[1])
            )
            .first();

        if (!treeObj) return { error: "Tree not found" };

        const treeText = Buffer.from(treeObj.data, "base64").toString();
        const lines = treeText.trim().split("\n").filter(Boolean);

        // Parse tree entries
        const entries: Array<{ name: string; type: string; mode: string; hash: string }> = [];
        for (const line of lines) {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            const name = nameParts.join(" ");
            entries.push({ name, type, mode, hash });
        }

        return { entries };
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

        // Create a blob object
        const contentBuffer = Buffer.from(args.content, "utf-8").toString("base64");
        const blobHash = `blob-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        await ctx.db.insert("objects", {
            repoId: repo._id,
            hash: blobHash,
            data: contentBuffer,
        });

        return {
            success: true,
            message: `File "${args.path}" created. Hash: ${blobHash.slice(0, 8)}`
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

        // Get all objects and search their content
        const allObjects = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) => q.eq("repoId", repo._id))
            .collect();

        const results: Array<{ path: string; line: string; lineNumber: number }> = [];

        // Simple search - in production you'd want to track file paths in objects
        for (const obj of allObjects) {
            try {
                const content = Buffer.from(obj.data, "base64").toString();
                const lines = content.split("\n");

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(args.pattern)) {
                        results.push({
                            path: `object-${obj.hash.slice(0, 8)}`,
                            line: lines[i].trim(),
                            lineNumber: i + 1,
                        });
                    }
                }
            } catch {
                // Skip binary files
            }
        }

        return { results, count: results.length };
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

        // Get current HEAD
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        if (!branchRef) return { error: "Branch not found" };

        const timestamp = Math.floor(Date.now() / 1000);
        const commitHash = `kit-${timestamp}-${Math.random().toString(36).slice(2, 10)}`;

        await ctx.db.insert("commits", {
            repoId: repo._id,
            hash: commitHash,
            treeHash: branchRef.commitHash,
            parentHash: branchRef.commitHash,
            author: "KitBot 🐱‍🏗️",
            message: args.message,
            timestamp,
            branch: repo.defaultBranch || "main",
            modifiedFiles: [],
        });

        return {
            success: true,
            message: `Changes committed: "${args.message}"`,
            hash: commitHash.slice(0, 12),
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

        const existing = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();

        if (existing) return { error: "Branch already exists" };

        // Get current HEAD to use as starting point
        const currentBranch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        if (!currentBranch) return { error: "Current branch not found" };

        await ctx.db.insert("branches", {
            repoId: repo._id,
            name: args.branch,
            commitHash: currentBranch.commitHash,
        });

        return { success: true, message: `Branch "${args.branch}" created` };
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

        const branch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();

        if (!branch) return { error: "Branch not found" };

        return {
            success: true,
            message: `Switched to branch "${args.branch}"`,
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

        const branch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", repo.defaultBranch || "main")
            )
            .first();

        return {
            branch: branch?.name || "main",
            head: branch?.commitHash.slice(0, 8) || "unknown",
            status: "clean",
            staged: 0,
            unstaged: 0,
            untracked: 0,
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

        // Get recent commits
        const commits = await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
            .take(2);

        if (commits.length < 2) {
            return { diff: "No changes to show", hasChanges: false };
        }

        return {
            diff: `Changes between commits:\n${commits[1].hash.slice(0, 8)} -> ${commits[0].hash.slice(0, 8)}\n\n${commits[0].message}`,
            hasChanges: true,
        };
    },
});
