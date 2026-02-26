import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Hash password using Web Crypto API (PBKDF2) — works everywhere, no external deps.
 * Production quality: uses 100k iterations of PBKDF2-SHA256 with random salt.
 */
async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        256
    );
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `pbkdf2:${saltHex}:${hashHex}`;
}

/**
 * Verify password against stored hash.
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [, saltHex, storedHashHex] = stored.split(":");
    if (!saltHex || !storedHashHex) return false;

    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const hash = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        256
    );
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex === storedHashHex;
}

/**
 * Generate a simple auth token (random hex string).
 */
function generateToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Legacy hash for backward compatibility with old accounts.
 */
function legacyHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + str.length.toString(36);
}

// ─── Register ───
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

        // Hash password with PBKDF2
        const passwordHash = await hashPassword(args.password);

        // Create user
        const userId = await ctx.db.insert("users", {
            username: args.username,
            email: args.email,
            passwordHash,
            displayName: args.displayName || args.username,
            bio: "",
            avatarUrl: "",
        });

        // Generate token
        const token = generateToken();
        await ctx.db.insert("tokens", {
            userId,
            token,
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

// ─── Login ───
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

        // Verify password — support both old simple hash and new PBKDF2
        let valid = false;
        if (user.passwordHash.startsWith("pbkdf2:")) {
            // New PBKDF2 format
            valid = await verifyPassword(args.password, user.passwordHash);
        } else {
            // Legacy simple hash — compare directly
            valid = user.passwordHash === legacyHash(args.password);
        }
        if (!valid) throw new Error("Invalid credentials");

        // Auto-migrate old hash to PBKDF2
        if (!user.passwordHash.startsWith("pbkdf2:")) {
            const newHash = await hashPassword(args.password);
            await ctx.db.patch(user._id, { passwordHash: newHash });
        }

        // Generate token
        const token = generateToken();
        await ctx.db.insert("tokens", {
            userId: user._id,
            token,
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

// ─── Verify Token ───
export const verifyToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const tokenRecord = await ctx.db
            .query("tokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!tokenRecord) return null;
        if (tokenRecord.expiresAt < Math.floor(Date.now() / 1000)) return null;

        const user = await ctx.db.get(tokenRecord.userId);
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

// ─── Update Profile ───
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

        const updates: Record<string, string> = {};
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

// ─── Get By Username ───
export const getByUsername = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
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

// ─── Get Current User ───
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
