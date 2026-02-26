import { v } from "convex/values";
import { query } from "./_generated/server";

// Global search - searches repos and users
export const global = query({
    args: { query: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.query) return { repos: [], users: [] };
        const searchTerm = args.query.toLowerCase();

        // Search repos
        const allRepos = await ctx.db.query("repos").collect();
        const matchingRepos = allRepos
            .filter((r) => r.isPublic && (
                r.name.toLowerCase().includes(searchTerm) ||
                r.ownerUsername.toLowerCase().includes(searchTerm) ||
                r.description.toLowerCase().includes(searchTerm)
            ))
            .slice(0, 10);

        // Search users
        const allUsers = await ctx.db.query("users").collect();
        const matchingUsers = allUsers
            .filter((u) =>
                u.username.toLowerCase().includes(searchTerm) ||
                u.displayName?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5);

        return {
            repos: matchingRepos,
            users: matchingUsers,
        };
    },
});
