import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a patch (like a PR)
export const create = mutation({
    args: {
        sourceRepoId: v.id("repos"),
        targetRepoId: v.id("repos"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        title: v.string(),
        description: v.string(),
        sourceBranch: v.string(),
        targetBranch: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("patches", {
            ...args,
            status: "open",
            timestamp: Date.now(),
        });
    },
});

// Get patches for a target repo
export const getByRepo = query({
    args: {
        repoId: v.id("repos"),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.status) {
            return await ctx.db.query("patches")
                .withIndex("by_target_status", (q) =>
                    q.eq("targetRepoId", args.repoId).eq("status", args.status!))
                .order("desc").collect();
        }
        return await ctx.db.query("patches")
            .withIndex("by_target", (q) => q.eq("targetRepoId", args.repoId))
            .order("desc").collect();
    },
});

// Get single patch
export const get = query({
    args: { patchId: v.id("patches") },
    handler: async (ctx, args) => await ctx.db.get(args.patchId),
});

// Close a patch
export const close = mutation({
    args: { patchId: v.id("patches"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const patch = await ctx.db.get(args.patchId);
        if (!patch) throw new Error("Patch not found");
        const targetRepo = await ctx.db.get(patch.targetRepoId);
        if (!targetRepo || targetRepo.ownerId !== args.userId) throw new Error("Only the repo owner can close patches");
        await ctx.db.patch(args.patchId, { status: "closed" });
    },
});

// Merge a patch (simplified — just marks as merged)
export const merge = mutation({
    args: { patchId: v.id("patches"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const patch = await ctx.db.get(args.patchId);
        if (!patch) throw new Error("Patch not found");
        const targetRepo = await ctx.db.get(patch.targetRepoId);
        if (!targetRepo || targetRepo.ownerId !== args.userId) throw new Error("Only the repo owner can merge patches");
        await ctx.db.patch(args.patchId, { status: "merged" });
        return { status: "merged" };
    },
});
