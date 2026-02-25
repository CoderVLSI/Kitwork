import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// POST /api/push — Receive push from CLI
http.route({
    path: "/api/push",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const body = await request.json();
            const { ownerUsername, repoName, branch, commitHash, objects, commitInfo } = body;

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
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }),
});

// GET /api/pull — Send objects to CLI for pull/clone
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
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }),
});

// CORS preflight
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
