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
        token: v.string(),
        expiresAt: v.number(),
    })
        .index("by_token", ["token"])
        .index("by_user", ["userId"]),

    // 🔑 Kit Keys — CLI auth tokens (like personal access tokens)
    kitKeys: defineTable({
        userId: v.id("users"),
        token: v.string(),       // hashed token
        name: v.string(),        // e.g. "My Laptop", "CI/CD"
        lastUsedAt: v.optional(v.number()),
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
        forkedFrom: v.optional(v.id("repos")), // Remix source
        forkedFromName: v.optional(v.string()), // "user/repo" display
    })
        .index("by_owner", ["ownerId"])
        .index("by_owner_name", ["ownerUsername", "name"])
        .index("by_forked_from", ["forkedFrom"]),

    // Branches
    branches: defineTable({
        repoId: v.id("repos"),
        name: v.string(),
        commitHash: v.string(),
    })
        .index("by_repo", ["repoId"])
        .index("by_repo_name", ["repoId", "name"]),

    // Git objects
    objects: defineTable({
        repoId: v.id("repos"),
        hash: v.string(),
        data: v.string(),
    })
        .index("by_repo_hash", ["repoId", "hash"]),

    // Commits
    commits: defineTable({
        repoId: v.id("repos"),
        hash: v.string(),
        treeHash: v.string(),
        parentHash: v.optional(v.string()),
        author: v.string(),
        message: v.string(),
        timestamp: v.number(),
        branch: v.string(),
        modifiedFiles: v.optional(v.array(v.string())), // Track which files were modified in this commit
    })
        .index("by_repo_branch", ["repoId", "branch"])
        .index("by_hash", ["repoId", "hash"]),

    // Activities
    activities: defineTable({
        userId: v.id("users"),
        type: v.string(),
        targetId: v.optional(v.id("repos")),
        description: v.string(),
        metadata: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_time", ["userId", "timestamp"]),

    // ─── UNIQUE KITWORK FEATURES ───

    // ⚡ Sparks — emoji reactions on repos (replaces stars)
    sparks: defineTable({
        userId: v.id("users"),
        repoId: v.id("repos"),
        emoji: v.string(), // "⚡" | "🔥" | "🚀" | "💎" | "🎯"
        timestamp: v.number(),
    })
        .index("by_repo", ["repoId"])
        .index("by_user_repo", ["userId", "repoId"])
        .index("by_user", ["userId"]),

    // 👥 Crew — follow system
    crew: defineTable({
        followerId: v.id("users"),
        followingId: v.id("users"),
        timestamp: v.number(),
    })
        .index("by_follower", ["followerId"])
        .index("by_following", ["followingId"])
        .index("by_pair", ["followerId", "followingId"]),

    // 🔥 Streaks — gamified commit tracking
    streaks: defineTable({
        userId: v.id("users"),
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastActiveDate: v.string(), // "2026-02-26"
        totalContributions: v.number(),
    })
        .index("by_user", ["userId"]),

    // 🧵 Threads — repo discussions
    threads: defineTable({
        repoId: v.id("repos"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        title: v.string(),
        body: v.string(),
        status: v.string(), // "open" | "resolved"
        replyCount: v.optional(v.number()),
        timestamp: v.number(),
    })
        .index("by_repo", ["repoId"])
        .index("by_repo_status", ["repoId", "status"]),

    // 🧵 Thread replies
    threadReplies: defineTable({
        threadId: v.id("threads"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        body: v.string(),
        timestamp: v.number(),
    })
        .index("by_thread", ["threadId"]),

    // 🩹 Patches — pull request equivalent
    patches: defineTable({
        sourceRepoId: v.id("repos"),
        targetRepoId: v.id("repos"),
        authorId: v.id("users"),
        authorUsername: v.string(),
        title: v.string(),
        description: v.string(),
        sourceBranch: v.string(),
        targetBranch: v.string(),
        status: v.string(), // "open" | "merged" | "closed"
        timestamp: v.number(),
    })
        .index("by_target", ["targetRepoId"])
        .index("by_source", ["sourceRepoId"])
        .index("by_target_status", ["targetRepoId", "status"]),
});
