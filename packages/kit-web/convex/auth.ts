import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Register with password (uses bcrypt in action)
export const registerWithPassword = action({
    args: {
        username: v.string(),
        email: v.string(),
        password: v.string(),
        displayName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Hash password with bcrypt
        const bcrypt = require("bcryptjs");
        const passwordHash = await bcrypt.hash(args.password, 10);

        // Call the internal register mutation with hashed password
        const result = await ctx.runMutation(internal.users.register, {
            username: args.username,
            email: args.email,
            passwordHash,
            displayName: args.displayName,
        });

        return result;
    },
});

// Login with password (uses bcrypt in action)
export const loginWithPassword = action({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the user first
        const user = await ctx.runQuery(internal.users.getByUsernameInternal, {
            username: args.username,
        });

        if (!user) throw new Error("Invalid credentials");

        // Verify password with bcrypt
        const bcrypt = require("bcryptjs");
        const valid = await bcrypt.compare(args.password, (user as any).passwordHash);
        if (!valid) throw new Error("Invalid credentials");

        // Call internal login mutation
        const result = await ctx.runMutation(internal.users.login, {
            userId: user._id,
        });

        return result;
    },
});
