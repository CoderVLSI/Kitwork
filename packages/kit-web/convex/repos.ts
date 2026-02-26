import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        ownerId: v.id("users"),
        ownerUsername: v.string(),
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Check if repo already exists for this user
        const existing = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.name)
            )
            .first();
        if (existing) throw new Error("Repository already exists");

        const repoId = await ctx.db.insert("repos", {
            name: args.name,
            ownerId: args.ownerId,
            ownerUsername: args.ownerUsername,
            description: args.description || "",
            isPublic: args.isPublic !== false,
            defaultBranch: "main",
        });

        // Track activity
        await ctx.db.insert("activities", {
            userId: args.ownerId,
            type: "repo_created",
            targetId: repoId,
            description: `Created repository ${args.name}`,
            timestamp: Math.floor(Date.now() / 1000),
        });

        return { id: repoId, name: args.name, owner: args.ownerUsername };
    },
});

// Update repo settings
export const updateSettings = mutation({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
        defaultBranch: v.optional(v.string()),
        requesterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) throw new Error("Repository not found");
        if (repo.ownerId !== args.requesterId) throw new Error("Only the owner can update repo settings");

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
        if (args.defaultBranch !== undefined) updates.defaultBranch = args.defaultBranch;

        await ctx.db.patch(repo._id, updates);

        // Track activity
        await ctx.db.insert("activities", {
            userId: args.requesterId,
            type: "repo_updated",
            targetId: repo._id,
            description: `Updated settings for ${args.repoName}`,
            timestamp: Math.floor(Date.now() / 1000),
        });

        return { success: true };
    },
});

// Delete a repository
export const deleteRepo = mutation({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        requesterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) throw new Error("Repository not found");
        if (repo.ownerId !== args.requesterId) throw new Error("Only the owner can delete the repo");

        // Delete all related data (sparks, threads, patches, etc.)
        const sparks = await ctx.db.query("sparks").withIndex("by_repo", (q) => q.eq("repoId", repo._id)).collect();
        for (const spark of sparks) await ctx.db.delete(spark._id);

        const threads = await ctx.db.query("threads").withIndex("by_repo", (q) => q.eq("repoId", repo._id)).collect();
        for (const thread of threads) await ctx.db.delete(thread._id);

        const patches = await ctx.db.query("patches").withIndex("by_source", (q) => q.eq("sourceRepoId", repo._id)).collect();
        for (const patch of patches) await ctx.db.delete(patch._id);

        const branches = await ctx.db.query("branches").withIndex("by_repo_name", (q) => q.eq("repoId", repo._id)).collect();
        for (const branch of branches) await ctx.db.delete(branch._id);

        const commits = await ctx.db.query("commits").withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id)).collect();
        for (const commit of commits) await ctx.db.delete(commit._id);

        const objects = await ctx.db.query("objects").withIndex("by_repo_hash", (q) => q.eq("repoId", repo._id)).collect();
        for (const obj of objects) await ctx.db.delete(obj._id);

        // Delete the repo
        await ctx.db.delete(repo._id);

        return { success: true };
    },
});

export const get = query({
    args: { ownerUsername: v.string(), name: v.string() },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.name)
            )
            .first();
        if (!repo) return null;

        // Get branches
        const branches = await ctx.db
            .query("branches")
            .withIndex("by_repo", (q) => q.eq("repoId", repo._id))
            .collect();

        return { ...repo, branches };
    },
});

export const listByUser = query({
    args: { ownerUsername: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.ownerUsername))
            .first();
        if (!user) return [];

        return await ctx.db
            .query("repos")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();
    },
});

export const getTree = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return { entries: [] };

        // Get branch commit
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) return { entries: [] };

        // Read commit object to get tree hash
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return { entries: [] };

        // Decompress and parse the commit
        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { entries: [] };

        let treeHash = treeMatch[1];

        // Navigate to path if specified
        if (args.path) {
            const parts = args.path.split("/").filter(Boolean);
            for (const part of parts) {
                const treeObj = await ctx.db
                    .query("objects")
                    .withIndex("by_repo_hash", (q) =>
                        q.eq("repoId", repo._id).eq("hash", treeHash)
                    )
                    .first();
                if (!treeObj) return { entries: [] };

                const treeText = decodeObject(treeObj.data);
                const lines = treeText.trim().split("\n").filter(Boolean);
                const found = lines.find((line: string) => {
                    const nameParts = line.split(" ").slice(3);
                    return nameParts.join(" ") === part;
                });
                if (!found) return { entries: [] };
                const [, type, hash] = found.split(" ");
                if (type !== "tree") return { entries: [] };
                treeHash = hash;
            }
        }

        // Read tree entries
        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeHash)
            )
            .first();
        if (!treeObj) return { entries: [] };

        const treeText = decodeObject(treeObj.data);
        const lines = treeText.trim().split("\n").filter(Boolean);
        const entries = lines.map((line: string) => {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            return { mode, type, hash, name: nameParts.join(" ") };
        });

        return { entries };
    },
});

export const getBlob = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.string(),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return null;

        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();
        if (!branchRef) return null;

        // Walk from commit → tree → path → blob
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return null;

        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return null;

        let currentHash = treeMatch[1];
        const parts = args.path.split("/").filter(Boolean);

        for (let i = 0; i < parts.length; i++) {
            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", currentHash)
                )
                .first();
            if (!treeObj) return null;

            const treeText = decodeObject(treeObj.data);
            const lines = treeText.trim().split("\n").filter(Boolean);
            const target = parts[i];

            let found = false;
            for (const line of lines) {
                const [mode, type, hash, ...nameParts] = line.split(" ");
                if (nameParts.join(" ") === target) {
                    if (i === parts.length - 1 && type === "blob") {
                        // Read the blob
                        const blobObj = await ctx.db
                            .query("objects")
                            .withIndex("by_repo_hash", (q) =>
                                q.eq("repoId", repo._id).eq("hash", hash)
                            )
                            .first();
                        if (!blobObj) return null;
                        return { path: args.path, content: decodeObject(blobObj.data), hash };
                    }
                    if (type === "tree") {
                        currentHash = hash;
                        found = true;
                        break;
                    }
                }
            }
            if (!found && i < parts.length - 1) return null;
        }

        return null;
    },
});

export const getCommits = query({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return [];

        const branch = args.branch || "main";
        return await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) =>
                q.eq("repoId", repo._id).eq("branch", branch)
            )
            .order("desc")
            .collect();
    },
});

export const listPublic = query({
    args: {},
    handler: async (ctx) => {
        // Get all public repos (ordered by creation time, newest first)
        const repos = await ctx.db
            .query("repos")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .order("desc")
            .take(100);
        return repos;
    },
});

// Get README.md content for a repo
export const getREADME = query({
    args: { ownerUsername: v.string(), repoName: v.string(), branch: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return null;

        const branch = args.branch || repo.defaultBranch || "main";

        // Get the branch reference
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branch)
            )
            .first();
        if (!branchRef) return null;

        // Get commit to find tree hash
        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return null;

        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return null;

        // Try to find README.md in the root tree
        const treeObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeMatch[1])
            )
            .first();
        if (!treeObj) return null;

        const treeText = decodeObject(treeObj.data);
        const lines = treeText.trim().split("\n").filter(Boolean);

        // Look for README.md (case-insensitive)
        for (const line of lines) {
            const [mode, type, hash, ...nameParts] = line.split(" ");
            const name = nameParts.join(" ");
            if (name.toLowerCase() === "readme.md" && type === "blob") {
                // Get the blob content
                const blobObj = await ctx.db
                    .query("objects")
                    .withIndex("by_repo_hash", (q) =>
                        q.eq("repoId", repo._id).eq("hash", hash)
                    )
                    .first();
                if (blobObj) {
                    return { content: decodeObject(blobObj.data) };
                }
            }
        }

        return null;
    },
});

/**
 * Create a new file/commit from the web interface
 * This creates a blob, updates the tree, creates a commit, and updates the branch
 */
export const createFile = mutation({
    args: {
        ownerUsername: v.string(),
        repoName: v.string(),
        branch: v.string(),
        path: v.string(),
        content: v.string(),
        message: v.string(),
        author: v.string(),
    },
    handler: async (ctx, args) => {
        // Get the repo
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) throw new Error("Repository not found");

        // Get the current branch (may not exist for empty repos)
        let branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", args.branch)
            )
            .first();

        // For empty repos — create an initial commit without parent
        const isFirstCommit = !branchRef;

        // Create blob object
        const blobContent = args.content;
        const blobHeader = `blob ${blobContent.length}\0`;
        const blobData = btoa(blobHeader + blobContent);
        const blobHash = simpleHash(blobContent);
        const existingBlob = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", blobHash)
            )
            .first();
        if (!existingBlob) {
            await ctx.db.insert("objects", {
                repoId: repo._id,
                hash: blobHash,
                data: blobData,
            });
        }

        // Build new tree with the new file
        let newTreeEntries: string[] = [];

        if (!isFirstCommit && branchRef) {
            // Get current commit's tree
            const commitObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
                )
                .first();

            if (commitObj) {
                const commitText = decodeObject(commitObj.data);
                const treeMatch = commitText.match(/^tree (\w+)/m);
                const parentTreeHash = treeMatch ? treeMatch[1] : null;

                if (parentTreeHash) {
                    const parentTreeObj = await ctx.db
                        .query("objects")
                        .withIndex("by_repo_hash", (q) =>
                            q.eq("repoId", repo._id).eq("hash", parentTreeHash)
                        )
                        .first();
                    if (parentTreeObj) {
                        const treeText = decodeObject(parentTreeObj.data);
                        const lines = treeText.trim().split("\n").filter(Boolean);
                        newTreeEntries = lines.filter((line: string) => {
                            const parts = line.split(" ");
                            const name = parts.slice(3).join(" ");
                            return name !== args.path;
                        });
                    }
                }
            }
        }

        // Add new file entry
        newTreeEntries.push(`100644 blob ${blobHash} ${args.path}`);
        newTreeEntries.sort();

        // Create new tree object
        const treeContent = newTreeEntries.join("\n") + "\n";
        const treeHeader = `tree ${treeContent.length}\0`;
        const treeData = btoa(treeHeader + treeContent);
        const treeHash = simpleHash("tree " + treeContent.length + "\0" + treeContent);

        const existingTree = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", treeHash)
            )
            .first();
        if (!existingTree) {
            await ctx.db.insert("objects", {
                repoId: repo._id,
                hash: treeHash,
                data: treeData,
            });
        }

        // Create commit object
        const now = Math.floor(Date.now() / 1000);
        const parentLine = isFirstCommit ? "" : `parent ${branchRef!.commitHash}\n`;
        const commitContent = `tree ${treeHash}\n` +
            parentLine +
            `author ${args.author} <${args.author}@kitwork> ${now} +0000\n` +
            `committer ${args.author} <${args.author}@kitwork> ${now} +0000\n` +
            `\n` +
            `${args.message}\n`;
        const commitHeader = `commit ${commitContent.length}\0`;
        const commitData = btoa(commitHeader + commitContent);
        const commitHash = simpleHash("commit " + commitContent.length + "\0" + commitContent);

        await ctx.db.insert("objects", {
            repoId: repo._id,
            hash: commitHash,
            data: commitData,
        });

        // Update or create branch reference
        if (isFirstCommit) {
            await ctx.db.insert("branches", {
                repoId: repo._id,
                name: args.branch,
                commitHash,
            });
        } else {
            await ctx.db.patch(branchRef!._id, { commitHash });
        }

        // Store commit info in commits table
        await ctx.db.insert("commits", {
            repoId: repo._id,
            hash: commitHash,
            treeHash,
            parentHash: isFirstCommit ? "" : branchRef!.commitHash,
            author: args.author,
            message: args.message,
            timestamp: now,
            branch: args.branch,
            modifiedFiles: [args.path], // Track the file that was created/modified
        });

        // Track activity
        await ctx.db.insert("activities", {
            userId: repo.ownerId,
            type: "file_created",
            targetId: repo._id,
            description: `Created ${args.path} in ${args.repoName}`,
            metadata: JSON.stringify({ path: args.path, message: args.message }),
            timestamp: now,
        });

        return { hash: commitHash, treeHash };
    },
});

/**
 * Simple SHA-256 hash function for web environment
 * Note: This is a simplified version. The CLI uses proper crypto.
 */
function simpleHash(content: string): string {
    // Use a simple hash for now - in production this should use crypto.subtle
    let hash = 0;
    const str = content;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to hex string padded to 8 characters
    return Math.abs(hash).toString(16).padStart(8, "0") +
        Math.abs(hash >> 8).toString(16).padStart(8, "0") +
        Math.abs(hash >> 16).toString(16).padStart(8, "0") +
        Math.abs(hash >> 24).toString(16).padStart(8, "0");
}

/**
 * Decode a stored git object: base64 → buffer → zlib inflate → skip header → text
 * Since Convex runs in a serverless environment, we use atob for base64
 */
function decodeObject(base64Data: string): string {
    // The data is zlib-compressed. In Convex serverless we can't use Node's zlib.
    // So instead, we store decompressed content as base64 in our objects table.
    // The CLI will send uncompressed base64 content for Convex compatibility.
    try {
        const binary = atob(base64Data);
        // Skip the Git object header: "type size\0"
        const nullIndex = binary.indexOf("\0");
        if (nullIndex !== -1) {
            return binary.slice(nullIndex + 1);
        }
        return binary;
    } catch {
        return base64Data;
    }
}

// ─── Remix (Fork) ───
export const remix = mutation({
    args: {
        sourceOwnerUsername: v.string(),
        sourceRepoName: v.string(),
        newOwnerId: v.id("users"),
        newOwnerUsername: v.string(),
    },
    handler: async (ctx, args) => {
        const sourceRepo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.sourceOwnerUsername).eq("name", args.sourceRepoName))
            .first();
        if (!sourceRepo) throw new Error("Source repository not found");

        // Check if user already has a repo with same name
        const existing = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.newOwnerUsername).eq("name", args.sourceRepoName))
            .first();
        if (existing) throw new Error("You already have a repo with this name");

        // Create the remixed repo
        const newRepoId = await ctx.db.insert("repos", {
            name: sourceRepo.name,
            ownerId: args.newOwnerId,
            ownerUsername: args.newOwnerUsername,
            description: sourceRepo.description,
            isPublic: true,
            defaultBranch: sourceRepo.defaultBranch,
            forkedFrom: sourceRepo._id,
            forkedFromName: `${args.sourceOwnerUsername}/${args.sourceRepoName}`,
        });

        // Copy all objects
        const objects = await ctx.db.query("objects")
            .withIndex("by_repo_hash", (q) => q.eq("repoId", sourceRepo._id))
            .collect();
        for (const obj of objects) {
            await ctx.db.insert("objects", {
                repoId: newRepoId, hash: obj.hash, data: obj.data,
            });
        }

        // Copy branches
        const branches = await ctx.db.query("branches")
            .withIndex("by_repo", (q) => q.eq("repoId", sourceRepo._id))
            .collect();
        for (const branch of branches) {
            await ctx.db.insert("branches", {
                repoId: newRepoId, name: branch.name, commitHash: branch.commitHash,
            });
        }

        // Copy commits
        const commits = await ctx.db.query("commits")
            .withIndex("by_repo_branch", (q) => q.eq("repoId", sourceRepo._id))
            .collect();
        for (const commit of commits) {
            await ctx.db.insert("commits", {
                repoId: newRepoId, hash: commit.hash, treeHash: commit.treeHash,
                parentHash: commit.parentHash, author: commit.author,
                message: commit.message, timestamp: commit.timestamp, branch: commit.branch,
                modifiedFiles: commit.modifiedFiles,
            });
        }

        // Track activity
        await ctx.db.insert("activities", {
            userId: args.newOwnerId,
            type: "repo_created",
            targetId: newRepoId,
            description: `Remixed ${args.sourceOwnerUsername}/${args.sourceRepoName}`,
            timestamp: Math.floor(Date.now() / 1000),
        });

        return { id: newRepoId, name: sourceRepo.name };
    },
});

// Get remix count for a repo
export const getRemixCount = query({
    args: { repoId: v.id("repos") },
    handler: async (ctx, args) => {
        const remixes = await ctx.db.query("repos")
            .withIndex("by_forked_from", (q) => q.eq("forkedFrom", args.repoId))
            .collect();
        return remixes.length;
    },
});

// Get explore data — all public repos with spark counts
export const getExploreData = query({
    handler: async (ctx) => {
        const repos = await ctx.db.query("repos").collect();
        const publicRepos = repos.filter(r => r.isPublic);

        // Get spark counts for each repo
        const reposWithStats = await Promise.all(publicRepos.map(async (repo) => {
            const sparks = await ctx.db.query("sparks")
                .withIndex("by_repo", (q) => q.eq("repoId", repo._id))
                .collect();

            const commits = await ctx.db.query("commits")
                .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
                .collect();

            const remixes = await ctx.db.query("repos")
                .withIndex("by_forked_from", (q) => q.eq("forkedFrom", repo._id))
                .collect();

            return {
                ...repo,
                sparkCount: sparks.length,
                commitCount: commits.length,
                remixCount: remixes.length,
            };
        }));

        return {
            trending: [...reposWithStats].sort((a, b) => b.sparkCount - a.sparkCount),
            mostActive: [...reposWithStats].sort((a, b) => b.commitCount - a.commitCount),
            newest: [...reposWithStats].sort((a, b) => {
                const aTime = a._creationTime || 0;
                const bTime = b._creationTime || 0;
                return bTime - aTime;
            }),
        };
    },
});

// Get repository stats: language breakdown, file count, commit count, contributors
export const getStats = query({
    args: { ownerUsername: v.string(), repoName: v.string() },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return null;

        const branch = repo.defaultBranch || "main";

        // Get all commits for this repo
        const allCommits = await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
            .collect();

        // Get unique contributors
        const contributors = Array.from(new Set(allCommits.map(c => c.author)));

        // Get latest commit
        const latestCommit = allCommits.sort((a, b) => b.timestamp - a.timestamp)[0];

        // Get file tree for language analysis
        const branchRef = await ctx.db
            .query("branches")
            .withIndex("by_repo_name", (q) =>
                q.eq("repoId", repo._id).eq("name", branch)
            )
            .first();
        if (!branchRef) return { commits: allCommits.length, contributors: contributors.length, latestCommit, languages: [], fileCount: 0 };

        const commitObj = await ctx.db
            .query("objects")
            .withIndex("by_repo_hash", (q) =>
                q.eq("repoId", repo._id).eq("hash", branchRef.commitHash)
            )
            .first();
        if (!commitObj) return { commits: allCommits.length, contributors: contributors.length, latestCommit, languages: [], fileCount: 0 };

        const commitText = decodeObject(commitObj.data);
        const treeMatch = commitText.match(/^tree (\w+)/m);
        if (!treeMatch) return { commits: allCommits.length, contributors: contributors.length, latestCommit, languages: [], fileCount: 0 };

        // Count files by language (recursively)
        const languageCounts: Record<string, number> = {};
        let fileCount = 0;
        const languageColors: Record<string, string> = {
            TypeScript: "#3178c6",
            JavaScript: "#f7df1e",
            JSX: "#61dafb",
            TSX: "#61dafb",
            Python: "#3572A5",
            Ruby: "#701516",
            Go: "#00ADD8",
            Rust: "#dea584",
            Java: "#b07219",
            "C#": "#239120",
            "C++": "#f34b7d",
            C: "#555555",
            Swift: "#F05138",
            PHP: "#4F5D95",
            HTML: "#e34c26",
            CSS: "#563d7c",
            SCSS: "#c6538c",
            JSON: "#f7df1e",
            YAML: "#cb171e",
            Shell: "#89e051",
            SQL: "#e38c00",
            Dockerfile: "#384d54",
            Markdown: "#083fa1",
            Text: "#cccccc",
        };

        async function countFilesInTree(treeHash: string): Promise<void> {
            const treeObj = await ctx.db
                .query("objects")
                .withIndex("by_repo_hash", (q) =>
                    q.eq("repoId", repo!._id).eq("hash", treeHash)
                )
                .first();
            if (!treeObj) return;

            const treeText = decodeObject(treeObj.data);
            const lines = treeText.trim().split("\n").filter(Boolean);

            for (const line of lines) {
                const [mode, type, hash, ...nameParts] = line.split(" ");
                const name = nameParts.join(" ");

                if (type === "blob") {
                    fileCount++;
                    const ext = name.split(".").pop()?.toLowerCase() || "";
                    const langMap: Record<string, string> = {
                        js: "JavaScript", jsx: "JSX", ts: "TypeScript", tsx: "TSX",
                        py: "Python", rb: "Ruby", go: "Go", rs: "Rust", java: "Java",
                        kt: "Kotlin", cpp: "C++", c: "C", h: "C", cs: "C#", swift: "Swift",
                        php: "PHP", html: "HTML", css: "CSS", scss: "SCSS", json: "JSON",
                        yml: "YAML", yaml: "YAML", toml: "TOML", xml: "XML", md: "Markdown",
                        txt: "Text", sh: "Shell", sql: "SQL", dockerfile: "Dockerfile",
                    };
                    const lang = langMap[ext] || "Text";
                    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
                } else if (type === "tree") {
                    await countFilesInTree(hash);
                }
            }
        }

        await countFilesInTree(treeMatch[1]);

        const languages = Object.entries(languageCounts)
            .map(([lang, count]) => ({
                name: lang,
                count,
                percentage: Math.round((count / fileCount) * 100),
                color: languageColors[lang] || "#cccccc",
            }))
            .sort((a, b) => b.count - a.count);

        return {
            commits: allCommits.length,
            contributors: contributors.length,
            latestCommit: latestCommit ? {
                hash: latestCommit.hash,
                message: latestCommit.message,
                author: latestCommit.author,
                timestamp: latestCommit.timestamp,
            } : null,
            languages,
            fileCount,
        };
    },
});

// Get last commit info for each file in a tree
export const getFileCommits = query({
    args: { ownerUsername: v.string(), repoName: v.string(), branch: v.string() },
    handler: async (ctx, args) => {
        const repo = await ctx.db
            .query("repos")
            .withIndex("by_owner_name", (q) =>
                q.eq("ownerUsername", args.ownerUsername).eq("name", args.repoName)
            )
            .first();
        if (!repo) return null;

        // Get all commits for this repo
        const allCommits = await ctx.db
            .query("commits")
            .withIndex("by_repo_branch", (q) => q.eq("repoId", repo._id))
            .collect();

        // Build a map of file -> last commit
        const fileCommits: Record<string, { hash: string; message: string; author: string; timestamp: number }> = {};

        // Sort commits by timestamp (newest first)
        const sortedCommits = allCommits.sort((a, b) => b.timestamp - a.timestamp);

        for (const commit of sortedCommits) {
            if (commit.modifiedFiles) {
                for (const file of commit.modifiedFiles) {
                    // Only set if not already set (we want the most recent commit)
                    if (!fileCommits[file]) {
                        fileCommits[file] = {
                            hash: commit.hash,
                            message: commit.message,
                            author: commit.author,
                            timestamp: commit.timestamp,
                        };
                    }
                }
            }
        }

        return fileCommits;
    },
});
