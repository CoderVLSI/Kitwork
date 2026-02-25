import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table
    users: defineTable({
        username: v.string(),
        email: v.string(),
        passwordHash: v.string(),
        displayName: v.string(),
        bio: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    })
        .index("by_username", ["username"])
        .index("by_email", ["email"]),

    // JWT tokens table for API authentication
    tokens: defineTable({
        userId: v.id("users"),
        token: v.string(), // JWT token hash
        expiresAt: v.number(), // Unix timestamp
    })
        .index("by_token", ["token"])
        .index("by_user", ["userId"]),

    // Repositories table
    repos: defineTable({
        name: v.string(),
        ownerId: v.id("users"),
        ownerUsername: v.string(),
        description: v.string(),
        isPublic: v.boolean(),
        defaultBranch: v.string(),
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_name", ["ownerUsername", "name"]),

    // Branches — stores the latest commit hash per branch per repo
    branches: defineTable({
        repoId: v.id("repos"),
        name: v.string(),
        commitHash: v.string(),
    })
        .index("by_repo", ["repoId"])
        .index("by_repo_name", ["repoId", "name"]),

    // Git objects — stores blobs/trees/commits (zlib-compressed, base64-encoded)
    objects: defineTable({
        repoId: v.id("repos"),
        hash: v.string(),
        data: v.string(), // base64-encoded compressed object
    })
        .index("by_repo_hash", ["repoId", "hash"]),

    // Commits (denormalized for fast listing)
    commits: defineTable({
        repoId: v.id("repos"),
        hash: v.string(),
        treeHash: v.string(),
        parentHash: v.optional(v.string()),
        author: v.string(),
        message: v.string(),
        timestamp: v.number(),
        branch: v.string(),
    })
        .index("by_repo_branch", ["repoId", "branch"])
        .index("by_hash", ["repoId", "hash"]),

    // Activities — user activity feed
    activities: defineTable({
        userId: v.id("users"),
        type: v.string(), // "repo_created", "commit_pushed", "profile_updated", "file_created"
        targetId: v.optional(v.id("repos")), // Related repo if applicable
        description: v.string(), // Human-readable description
        metadata: v.optional(v.string()), // JSON string with extra data
        timestamp: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_time", ["userId", "timestamp"]),
});
