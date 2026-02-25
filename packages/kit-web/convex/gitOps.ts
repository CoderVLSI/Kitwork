import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Store a batch of git objects for a push operation.
 */
export const push = mutation({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        commitHash: v.string(),
        objects: v.array(
            v.object({
                hash: v.string(),
                data: v.string(), // base64-encoded raw object (uncompressed for Convex)
            })
        ),
        commitInfo: v.optional(
            v.object({
                message: v.string(),
                author: v.string(),
                timestamp: v.number(),
                treeHash: v.string(),
                parentHash: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        // Find or auto-create repo
        let repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();

        if (!repo) {
            // Auto-create the repo if user exists
            const user = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", args.ownerUsername))
                .first();

            if (!user) {
                throw new Error("User not found");
            }

            const repoId = await ctx.db.insert("repos", {
                name: args.repoName,
                ownerId: user._id,
                ownerUsername: args.ownerUsername,
                description: "",
                isPublic: true,
                defaultBranch: "main",
            });
            repo = await ctx.db.get(repoId);
        }

        if (!repo) throw new Error("Failed to create repo");

        // Store objects (skip if already exists)
        let stored = 0;
        for (const obj of args.objects) {
            const existing = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo!._id).eq("hash", obj.hash)
                )
                .first();

            if (!existing) {
                await ctx.db.insert("objects", {
                    repoId: repo._id,
                    hash: obj.hash,
                    data: obj.data,
                });
                stored++;
            }
        }

        // Update or create branch ref
        const existingBranch = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo!._id).eq("name", args.branch)
            )
            .first();

        if (existingBranch) {
            await ctx.db.patch(existingBranch._id, { commitHash: args.commitHash });
        } else {
            await ctx.db.insert("branches", {
                repoId: repo._id,
                name: args.branch,
                commitHash: args.commitHash,
            });
        }

        // Store commit info if provided
        if (args.commitInfo) {
            const existingCommit = await ctx.db
                .query("commits")
                .withIndex("by_hash", (q) =>
                    q.eq("repoId", repo!._id).eq("hash", args.commitHash)
                )
                .first();

            if (!existingCommit) {
                await ctx.db.insert("commits", {
                    repoId: repo._id,
                    hash: args.commitHash,
                    treeHash: args.commitInfo.treeHash,
                    parentHash: args.commitInfo.parentHash,
                    author: args.commitInfo.author,
                    message: args.commitInfo.message,
                    timestamp: args.commitInfo.timestamp,
                    branch: args.branch,
                });
            }
        }

        return { success: true, stored, total: args.objects.length };
    },
});

/**
 * Get all objects for pull.
 */
export const pull = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) throw new Error("Repository not found");

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) throw new Error("Branch not found");

        // Get all objects for this repo
        const objects = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) => q.eq("repoId", repo._id))
            .collect();

        return {
            branch: args.branch,
            commitHash: branchRef.commitHash,
            objects: objects.map((o) => ({ hash: o.hash, data: o.data })),
        };
    },
});
