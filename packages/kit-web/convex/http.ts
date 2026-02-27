import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ─── Helper: hash a raw Kit Key token to match stored hash ───
async function hashToken(rawToken: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── POST /api/auth/login — CLI login, returns a Kit Key ───
http.route({
    path: "/api/auth/login",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const { username, password } = await request.json();
            if (!username || !password) {
                return new Response(JSON.stringify({ error: "Username and password required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            // Use the existing login mutation to verify credentials
            const user = await ctx.runMutation(api.users.login, { username, password });

            // Generate a Kit Key for CLI use
            const { rawToken } = await ctx.runMutation(api.users.createKitKey, {
                userId: user.id,
                name: "CLI Login",
            });

            return new Response(JSON.stringify({
                token: rawToken,
                username: user.username,
                displayName: user.displayName,
            }), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    }),
});

http.route({
    path: "/api/auth/login",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }),
});

// ─── POST /api/push — Receive push from CLI (now auth-protected) ───
http.route({
    path: "/api/push",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const body = await request.json();
            const { ownerUsername, repoName, branch, commitHash, objects, commitInfo } = body;

            // Check for auth token
            const authHeader = request.headers.get("Authorization");
            let authUser = null;

            if (authHeader && authHeader.startsWith("Bearer ")) {
                const rawToken = authHeader.slice(7);
                const tokenHash = await hashToken(rawToken);
                authUser = await ctx.runQuery(api.users.verifyKitKey, { tokenHash });

                if (authUser) {
                    // Update last used timestamp
                    await ctx.runMutation(api.users.touchKitKey, { keyId: authUser.keyId });
                }
            }

            // If auth is provided, verify the user owns the repo
            if (authUser && authUser.username !== ownerUsername) {
                return new Response(JSON.stringify({ error: `Permission denied: you are logged in as '${authUser.username}' but pushing to '${ownerUsername}'` }), {
                    status: 403,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            const result = await ctx.runMutation(api.gitOps.push, {
                ownerUsername,
                repoName,
                branch,
                commitHash,
                objects: objects || [],
                commitInfo,
            });

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    }),
});

// ─── GET /api/pull — Send objects to CLI for pull/clone ───
http.route({
    path: "/api/pull",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        try {
            const url = new URL(request.url);
            const ownerUsername = url.searchParams.get("owner") || "";
            const repoName = url.searchParams.get("repo") || "";
            const branch = url.searchParams.get("branch") || "main";

            const result = await ctx.runQuery(api.gitOps.pull, {
                ownerUsername,
                repoName,
                branch,
            });

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 404,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    }),
});

// ─── CORS preflight ───
http.route({
    path: "/api/push",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }),
});

http.route({
    path: "/api/pull",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }),
});

export default http;
