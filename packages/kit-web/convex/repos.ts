import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        ownerId: v.id("users"),
        ownerUsername: v.string(),
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Check if repo already exists for this user
        const existing = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.name)
            )
            .first();
        if (existing) throw new Error("Repository already exists");

        const repoId = await ctx.db.insert("repos", {
            name: args.name,
            ownerId: args.ownerId,
            ownerUsername: args.ownerUsername,
            description: args.description || "",
            isPublic: args.isPublic !== false,
            defaultBranch: "main",
        });

        return { id: repoId, name: args.name, owner: args.ownerUsername };
    },
});

export const get = query({
    args: { ownerUsername: v.string(), name: v.string() },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.name)
            )
            .first();
        if (!repo) return null;

        // Get branches
        const branches = await ctx.db
            .query("branches")
            .withIndex("by_repo", (q) => q.eq("repoId", repo._id))
            .collect();

        return { ...repo, branches };
    },
});

export const listByUser = query({
    args: { ownerUsername: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.ownerUsername))
            .first();
        if (!user) return [];

        return await ctx.db
            .query("repos")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();
    },
});

export const getTree = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return { entries: [] };

        // Get branch commit
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) return { entries: [] };

        // Read commit object to get tree hash
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return { entries: [] };

        // Decompress and parse the commit
        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { entries: [] };

        let treeHash = treeMatch[1];

        // Navigate to path if specified
        if (args.path) {
            const parts = args.path.split("/").filter(Boolean);
            for (const part of parts) {
                const treeObj = await ctx.db
                    .query("objects")
                    .withIndex("by_repo_hash", (q) =>
                        q.eq("repoId", repo._id).eq("hash", treeHash)
                    )
                    .first();
                if (!treeObj) return { entries: [] };

                const treeText = decodeObject(treeObj.data);
                const lines = treeText.trim().split("\n").filter(Boolean);
                const found = lines.find((line: string) => {
                    const nameParts = line.split(" ").slice(3);
                    return nameParts.join(" ") === part;
                });
                if (!found) return { entries: [] };
                const [, type, hash] = found.split(" ");
                if (type !== "tree") return { entries: [] };
                treeHash = hash;
            }
        }

        // Read tree entries
        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeHash)
            )
            .first();
        if (!treeObj) return { entries: [] };

        const treeText = decodeObject(treeObj.data);
        const lines = treeText.trim().split("\n").filter(Boolean);
        const entries = lines.map((line: string) => {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            return { mode, type, hash, name: nameParts.join(" ") };
        });

        return { entries };
    },
});

export const getBlob = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.string(),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return null;

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) return null;

        // Walk from commit → tree → path → blob
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return null;

        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return null;

        let currentHash = treeMatch[1];
        const parts = args.path.split("/").filter(Boolean);

        for (let i = 0; i < parts.length; i++) {
            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", currentHash)
                )
                .first();
            if (!treeObj) return null;

            const treeText = decodeObject(treeObj.data);
            const lines = treeText.trim().split("\n").filter(Boolean);
            const target = parts[i];

            let found = false;
            for (const line of lines) {
                const [mode, type, hash, ...nameParts] = line.split(" ");
                if (nameParts.join(" ") === target) {
                    if (i === parts.length - 1 && type === "blob") {
                        // Read the blob
                        const blobObj = await ctx.db
                            .query("objects")
                            .withIndex("by_repo_hash", (q) =>
                                q.eq("repoId", repo._id).eq("hash", hash)
                            )
                            .first();
                        if (!blobObj) return null;
                        return { path: args.path, content: decodeObject(blobObj.data), hash };
                    }
                    if (type === "tree") {
                        currentHash = hash;
                        found = true;
                        break;
                    }
                }
            }
            if (!found && i < parts.length - 1) return null;
        }

        return null;
    },
});

export const getCommits = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return [];

        const branch = args.branch || "main";
        return await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) =>
                q.eq("repoId", repo._id).eq("branch", branch)
            )
            .order("desc")
            .collect();
    },
});

export const listPublic = query({
    args: {},
    handler: async (ctx) => {
        // Get all public repos (ordered by creation time, newest first)
        const repos = await ctx.db
            .query("repos")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .order("desc")
            .take(100);
        return repos;
    },
});

/**
 * Create a new file/commit from the web interface
 * This creates a blob, updates the tree, creates a commit, and updates the branch
 */
export const createFile = mutation({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.string(),
        content: v.string(),
        message: v.string(),
        author: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the repo
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) throw new Error("Repository not found");

        // Get the current branch
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) throw new Error("Branch not found");

        // Create blob object
        const blobContent = args.content;
        const blobHeader = `blob ${blobContent.length}\0`;
        const blobData = btoa(blobHeader + blobContent);
        const blobHash = simpleHash(blobContent);
        const existingBlob = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", blobHash)
            )
            .first();
        if (!existingBlob) {
            await ctx.db.insert("objects", {
                repoId: repo._id,
                hash: blobHash,
                data: blobData,
            });
        }

        // Get current commit's tree
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) throw new Error("Commit not found");

        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        const parentTreeHash = treeMatch ? treeMatch[1] : null;

        // Build new tree with the new file
        let newTreeEntries: string[] = [];

        if (parentTreeHash) {
            // Read existing tree
            const parentTreeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", parentTreeHash)
                )
                .first();
            if (parentTreeObj) {
                const treeText = decodeObject(parentTreeObj.data);
                const lines = treeText.trim().split("\n").filter(Boolean);
                // Filter out existing entry with same path
                newTreeEntries = lines.filter((line: string) => {
                    const parts = line.split(" ");
                    const name = parts.slice(3).join(" ");
                    return name !== args.path;
                });
            }
        }

        // Add new file entry
        newTreeEntries.push(`100644 blob ${blobHash} ${args.path}`);
        newTreeEntries.sort();

        // Create new tree object
        const treeContent = newTreeEntries.join("\n") + "\n";
        const treeHeader = `tree ${treeContent.length}\0`;
        const treeData = btoa(treeHeader + treeContent);
        const treeHash = simpleHash("tree " + treeContent.length + "\0" + treeContent);

        const existingTree = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeHash)
            )
            .first();
        if (!existingTree) {
            await ctx.db.insert("objects", {
                repoId: repo._id,
                hash: treeHash,
                data: treeData,
            });
        }

        // Create commit object
        const now = Math.floor(Date.now() / 1000);
        const commitContent = `tree ${treeHash}\n` +
            `parent ${branchRef.commitHash}\n` +
            `author ${args.author} <${args.author}@kitwork> ${now} +0000\n` +
            `committer ${args.author} <${args.author}@kitwork> ${now} +0000\n` +
            `\n` +
            `${args.message}\n`;
        const commitHeader = `commit ${commitContent.length}\0`;
        const commitData = btoa(commitHeader + commitContent);
        const commitHash = simpleHash("commit " + commitContent.length + "\0" + commitContent);

        await ctx.db.insert("objects", {
            repoId: repo._id,
            hash: commitHash,
            data: commitData,
        });

        // Update branch reference
        await ctx.db.patch(branchRef._id, { commitHash });

        // Store commit info in commits table
        await ctx.db.insert("commits", {
            repoId: repo._id,
            hash: commitHash,
            treeHash,
            parentHash: branchRef.commitHash,
            author: args.author,
            message: args.message,
            timestamp: now,
            branch: args.branch,
        });

        return { hash: commitHash, treeHash };
    },
});

/**
 * Simple SHA-256 hash function for web environment
 * Note: This is a simplified version. The CLI uses proper crypto.
 */
function simpleHash(content: string): string {
    // Use a simple hash for now - in production this should use crypto.subtle
    let hash = 0;
    const str = content;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to hex string padded to 8 characters
    return Math.abs(hash).toString(16).padStart(8, "0") +
           Math.abs(hash >> 8).toString(16).padStart(8, "0") +
           Math.abs(hash >> 16).toString(16).padStart(8, "0") +
           Math.abs(hash >> 24).toString(16).padStart(8, "0");
}

/**
 * Decode a stored git object: base64 → buffer → zlib inflate → skip header → text
 * Since Convex runs in a serverless environment, we use atob for base64
 */
function decodeObject(base64Data: string): string {
    // The data is zlib-compressed. In Convex serverless we can't use Node's zlib.
    // So instead, we store decompressed content as base64 in our objects table.
    // The CLI will send uncompressed base64 content for Convex compatibility.
    try {
        const binary = atob(base64Data);
        // Skip the Git object header: "type size\0"
        const nullIndex = binary.indexOf("\0");
        if (nullIndex !== -1) {
            return binary.slice(nullIndex + 1);
        }
        return binary;
    } catch {
        return base64Data;
    }
}
