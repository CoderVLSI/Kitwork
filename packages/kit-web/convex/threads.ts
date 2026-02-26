import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new thread
export const create = mutation({
    args: {
        repoId: v.id("repos"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        title: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("threads", {
            repoId: args.repoId,
            authorId: args.authorId,
            authorUsername: args.authorUsername,
            title: args.title,
            body: args.body,
            status: "open",
            replyCount: 0,
            timestamp: Date.now(),
        });
    },
});

// Reply to a thread
export const reply = mutation({
    args: {
        threadId: v.id("threads"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) throw new Error("Thread not found");

        const replyId = await ctx.db.insert("threadReplies", {
            threadId: args.threadId,
            authorId: args.authorId,
            authorUsername: args.authorUsername,
            body: args.body,
            timestamp: Date.now(),
        });

        // Update reply count
        await ctx.db.patch(args.threadId, {
            replyCount: (thread.replyCount || 0) + 1,
        });

        return replyId;
    },
});

// Toggle thread status
export const toggleStatus = mutation({
    args: {
        threadId: v.id("threads"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) throw new Error("Thread not found");
        if (thread.authorId !== args.userId) throw new Error("Only the author can change status");

        const newStatus = thread.status === "open" ? "resolved" : "open";
        await ctx.db.patch(args.threadId, { status: newStatus });
        return { status: newStatus };
    },
});

// Get threads for a repo
export const getByRepo = query({
    args: {
        repoId: v.id("repos"),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.status) {
            return await ctx.db
                .query("threads")
                .withIndex("by_repo_status", (q) =>
                    q.eq("repoId", args.repoId).eq("status", args.status!)
                )
                .order("desc")
                .collect();
        }
        return await ctx.db
            .query("threads")
            .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
            .order("desc")
            .collect();
    },
});

// Get replies for a thread
export const getReplies = query({
    args: { threadId: v.id("threads") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("threadReplies")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .order("asc")
            .collect();
    },
});

// Get single thread
export const getThread = query({
    args: { threadId: v.id("threads") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.threadId);
    },
});
