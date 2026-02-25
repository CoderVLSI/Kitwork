import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const trackActivity = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        targetId: v.optional(v.id("repos")),
        description: v.string(),
        metadata: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("activities", {
            userId: args.userId,
            type: args.type,
            targetId: args.targetId,
            description: args.description,
            metadata: args.metadata,
            timestamp: Math.floor(Date.now() / 1000),
        });
        return { success: true };
    },
});

export const getActivities = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
        if (!user) return [];

        // Get activities ordered by timestamp desc
        const activities = await ctx.db
            .query("activities")
            .withIndex("by_user_time", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(20);

        // Enrich with repo info if available
        const enriched = await Promise.all(
            activities.map(async (activity) => {
                let repo = null;
                if (activity.targetId) {
                    repo = await ctx.db.get(activity.targetId);
                }
                return {
                    ...activity,
                    repo: repo ? { name: repo.name, ownerUsername: repo.ownerUsername } : null,
                };
            })
        );

        return enriched;
    },
});

// Helper function to track activities from other mutations
export async function logActivity(
    ctx: any,
    userId: any,
    type: string,
    description: string,
    targetId?: any
) {
    await ctx.db.insert("activities", {
        userId,
        type,
        targetId,
        description,
        timestamp: Math.floor(Date.now() / 1000),
    });
}
