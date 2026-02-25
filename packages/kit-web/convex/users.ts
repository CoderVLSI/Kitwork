import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for passwords (in production, use proper bcrypt via an action)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + str.length.toString(36);
}

export const register = mutation({
    args: {
        username: v.string(),
        email: v.string(),
        password: v.string(),
        displayName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if username or email exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
        if (existingUser) throw new Error("Username already taken");

        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        if (existingEmail) throw new Error("Email already taken");

        // Create user
        const userId = await ctx.db.insert("users", {
            username: args.username,
            email: args.email,
            passwordHash: simpleHash(args.password),
            displayName: args.displayName || args.username,
            bio: "",
            avatarUrl: "",
        });

        return {
            id: userId,
            username: args.username,
            email: args.email,
            displayName: args.displayName || args.username,
        };
    },
});

export const login = mutation({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        if (!user) throw new Error("Invalid credentials");
        if (user.passwordHash !== simpleHash(args.password)) {
            throw new Error("Invalid credentials");
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
        };
    },
});

export const getByUsername = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
    },
});

export const me = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        return {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            bio: user.bio,
        };
    },
});
