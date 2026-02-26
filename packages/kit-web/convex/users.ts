import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "kitwork-secret-key-change-in-production"
);

// Generate JWT token
async function generateToken(userId: string, username: string): Promise<string> {
    const token = await new SignJWT({ userId, username })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(JWT_SECRET);
    return token;
}

// Verify JWT token
export async function verifyJwtToken(token: string): Promise<{ userId: string; username: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            userId: payload.userId as string,
            username: payload.username as string,
        };
    } catch {
        return null;
    }
}

export const register = mutation({
    args: {
        username: v.string(),
        email: v.string(),
        passwordHash: v.string(),
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
            passwordHash: args.passwordHash,
            displayName: args.displayName || args.username,
            bio: "",
            avatarUrl: "",
        });

        // Generate JWT token
        const token = await generateToken(userId, args.username);

        // Store token
        const tokenHash = `token_${token}_${Date.now()}`;
        await ctx.db.insert("tokens", {
            userId,
            token: tokenHash,
            expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        return {
            id: userId,
            username: args.username,
            email: args.email,
            displayName: args.displayName || args.username,
            token,
        };
    },
});

export const login = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId) as any;
        if (!user) throw new Error("Invalid credentials");

        // Generate JWT token
        const token = await generateToken(user._id, user.username);

        // Store token
        const tokenHash = `token_${token}_${Date.now()}`;
        await ctx.db.insert("tokens", {
            userId: user._id,
            token: tokenHash,
            expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            token,
        };
    },
});

export const verifyToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const result = await verifyJwtToken(args.token);
        if (!result) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", result.username))
            .first() as any;

        if (!user) return null;

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
        };
    },
});

export const updateProfile = mutation({
    args: {
        userId: v.id("users"),
        displayName: v.optional(v.string()),
        bio: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const updates: any = {};
        if (args.displayName !== undefined) updates.displayName = args.displayName;
        if (args.bio !== undefined) updates.bio = args.bio;
        if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

        await ctx.db.patch(args.userId, updates);

        // Track activity
        await ctx.db.insert("activities", {
            userId: args.userId,
            type: "profile_updated",
            description: "Updated their profile",
            timestamp: Math.floor(Date.now() / 1000),
        });

        return { success: true };
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
            avatarUrl: user.avatarUrl,
        };
    },
});
