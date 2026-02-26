import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Valid spark types (ASCII-safe, mapped to emoji on frontend)
// bolt=⚡  fire=🔥  rocket=🚀  gem=💎  target=🎯
const VALID_SPARKS = ["bolt", "fire", "rocket", "gem", "target"];

// Toggle a spark reaction on a repo
export const toggle = mutation({
    args: {
        userId: v.id("users"),
        repoId: v.id("repos"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        if (!VALID_SPARKS.includes(args.emoji)) {
            throw new Error("Invalid spark type");
        }
        const existing = await ctx.db
            .query("sparks")
            .withIndex("by_user_repo", (q) =>
                q.eq("userId", args.userId).eq("repoId", args.repoId)
            )
            .first();

        if (existing) {
            if (existing.emoji === args.emoji) {
                // Remove spark (un-react)
                await ctx.db.delete(existing._id);
                return { action: "removed" };
            } else {
                // Change emoji
                await ctx.db.patch(existing._id, { emoji: args.emoji, timestamp: Date.now() });
                return { action: "changed", emoji: args.emoji };
            }
        } else {
            // Add new spark
            await ctx.db.insert("sparks", {
                userId: args.userId,
                repoId: args.repoId,
                emoji: args.emoji,
                timestamp: Date.now(),
            });
            return { action: "added", emoji: args.emoji };
        }
    },
});

// Get sparks for a repo with counts per type
export const getByRepo = query({
    args: { repoId: v.id("repos") },
    handler: async (ctx, args) => {
        const sparks = await ctx.db
            .query("sparks")
            .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
            .collect();

        // Filter to only valid ASCII spark IDs (skip any legacy emoji records)
        const validSparks = sparks.filter(s => VALID_SPARKS.includes(s.emoji));

        // Build counts as array (not object) to avoid Convex field name restrictions
        const countMap = new Map<string, number>();
        for (const spark of validSparks) {
            countMap.set(spark.emoji, (countMap.get(spark.emoji) || 0) + 1);
        }
        const counts = Array.from(countMap.entries()).map(([id, count]) => ({ id, count }));

        return {
            total: validSparks.length,
            counts,
            sparks: validSparks.map(s => ({ userId: s.userId, emoji: s.emoji })),
        };
    },
});

// Get user's spark on a specific repo
export const getUserSpark = query({
    args: { userId: v.id("users"), repoId: v.id("repos") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sparks")
            .withIndex("by_user_repo", (q) =>
                q.eq("userId", args.userId).eq("repoId", args.repoId)
            )
            .first();
    },
});

// Get all repos sparked by a user
export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sparks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});
