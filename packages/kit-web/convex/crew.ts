import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Follow / unfollow a user
export const toggle = mutation({
    args: {
        followerId: v.id("users"),
        followingId: v.id("users"),
    },
    handler: async (ctx, args) => {
        if (args.followerId === args.followingId) {
            throw new Error("You can't follow yourself");
        }

        const existing = await ctx.db
            .query("crew")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.followerId).eq("followingId", args.followingId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "unfollowed" };
        } else {
            await ctx.db.insert("crew", {
                followerId: args.followerId,
                followingId: args.followingId,
                timestamp: Date.now(),
            });
            return { action: "followed" };
        }
    },
});

// Check if user A follows user B
export const isFollowing = query({
    args: { followerId: v.id("users"), followingId: v.id("users") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("crew")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.followerId).eq("followingId", args.followingId)
            )
            .first();
        return !!existing;
    },
});

// Get follower/following counts for a user
export const getCounts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const followers = await ctx.db
            .query("crew")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .collect();

        const following = await ctx.db
            .query("crew")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        return {
            followers: followers.length,
            following: following.length,
        };
    },
});

// Get followers list
export const getFollowers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("crew")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .collect();

        const users = await Promise.all(
            records.map(async (r) => {
                const user = await ctx.db.get(r.followerId);
                return user ? {
                    id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                } : null;
            })
        );

        return users.filter(Boolean);
    },
});

// Get following list
export const getFollowing = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const records = await ctx.db
            .query("crew")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        const users = await Promise.all(
            records.map(async (r) => {
                const user = await ctx.db.get(r.followingId);
                return user ? {
                    id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                } : null;
            })
        );

        return users.filter(Boolean);
    },
});
