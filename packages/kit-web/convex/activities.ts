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

// Get contribution heatmap data — returns array of daily contribution counts for the last 365 days
export const getContributionData = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        // Get user
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
        if (!user) return [];

        // Get all repos owned by this user
        const repos = await ctx.db
            .query("repos")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

        if (repos.length === 0) return [];

        // Get all commits from all repos for the last year
        const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000);
        const allCommits: any[] = [];
        for (const repo of repos) {
            const repoCommits = await ctx.db
                .query("commits")
                .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
                .collect();
            allCommits.push(...repoCommits.filter((c: any) => c.timestamp > oneYearAgo));
        }

        // Group commits by day (YYYY-MM-DD format)
        const contributionsByDay: Record<string, number> = {};
        for (const commit of allCommits) {
            const date = new Date(commit.timestamp * 1000);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            contributionsByDay[dateKey] = (contributionsByDay[dateKey] || 0) + 1;
        }

        // Generate array of 365 days starting from one year ago
        const contributionData: number[] = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);

        for (let i = 0; i < 365; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            contributionData.push(contributionsByDay[dateKey] || 0);
        }

        return contributionData;
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
