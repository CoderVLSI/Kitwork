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
