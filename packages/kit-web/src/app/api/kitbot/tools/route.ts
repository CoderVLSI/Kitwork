import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

// Available tools for KitBot
const TOOLS = {
    "list_files": {
        description: "List all files in the current directory or a specific path",
        parameters: {
            path: { type: "string", description: "Directory path (optional, defaults to root)", optional: true },
        },
    },
    "read_file": {
        description: "Read the contents of a specific file",
        parameters: {
            path: { type: "string", description: "File path to read" },
        },
    },
    "write_file": {
        description: "Write content to a file (creates new file or overwrites existing)",
        parameters: {
            path: { type: "string", description: "File path to write" },
            content: { type: "string", description: "Content to write" },
            message: { type: "string", description: "Commit message" },
        },
    },
    "search": {
        description: "Search for text/pattern in files (grep)",
        parameters: {
            pattern: { type: "string", description: "Text or regex pattern to search for" },
            filePattern: { type: "string", description: "File pattern (optional, e.g., *.tsx)", optional: true },
        },
    },
    "commit": {
        description: "Commit changes with a message",
        parameters: {
            message: { type: "string", description: "Commit message" },
        },
    },
    "create_branch": {
        description: "Create a new branch",
        parameters: {
            branch: { type: "string", description: "Branch name" },
        },
    },
    "switch_branch": {
        description: "Switch to a different branch",
        parameters: {
            branch: { type: "string", description: "Branch name" },
        },
    },
    "log": {
        description: "Show commit history",
        parameters: {
            limit: { type: "number", description: "Number of commits to show (optional)", optional: true },
        },
    },
    "status": {
        description: "Show working tree status",
        parameters: {},
    },
    "diff": {
        description: "Show changes between commits or working tree",
        parameters: {
            path: { type: "string", description: "File path to diff (optional)", optional: true },
        },
    },
};

export async function POST(request: NextRequest) {
    try {
        const { tool, params, username, repoName, userId } = await request.json();

        if (!TOOLS[tool as keyof typeof TOOLS]) {
            return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
        }

        let result: any;

        switch (tool) {
            case "list_files":
                result = await fetchQuery(api.kitbot.listFiles, {
                    username,
                    repoName,
                    path: params.path,
                });
                break;

            case "read_file":
                result = await fetchQuery(api.kitbot.readFile, {
                    username,
                    repoName,
                    path: params.path,
                });
                break;

            case "write_file":
                result = await fetchMutation(api.kitbot.writeFile, {
                    username,
                    repoName,
                    path: params.path,
                    content: params.content,
                    message: params.message,
                    userId,
                });
                break;

            case "search":
                result = await fetchQuery(api.kitbot.search, {
                    username,
                    repoName,
                    pattern: params.pattern,
                    filePattern: params.filePattern,
                });
                break;

            case "commit":
                result = await fetchMutation(api.kitbot.commit, {
                    username,
                    repoName,
                    message: params.message,
                    userId,
                });
                break;

            case "create_branch":
                result = await fetchMutation(api.kitbot.createBranch, {
                    username,
                    repoName,
                    branch: params.branch,
                    userId,
                });
                break;

            case "switch_branch":
                result = await fetchMutation(api.kitbot.switchBranch, {
                    username,
                    repoName,
                    branch: params.branch,
                    userId,
                });
                break;

            case "log":
                result = await fetchQuery(api.kitbot.getLog, {
                    username,
                    repoName,
                    limit: params.limit,
                });
                break;

            case "status":
                result = await fetchQuery(api.kitbot.getStatus, {
                    username,
                    repoName,
                });
                break;

            case "diff":
                result = await fetchQuery(api.kitbot.getDiff, {
                    username,
                    repoName,
                    path: params.path,
                });
                break;

            default:
                return NextResponse.json({ error: `Tool not implemented: ${tool}` }, { status: 501 });
        }

        return NextResponse.json({ result });
    } catch (error: any) {
        console.error("KitBot tool error:", error);
        return NextResponse.json(
            { error: error.message || "Tool execution failed" },
            { status: 500 }
        );
    }
}

// GET returns available tools
export async function GET() {
    return NextResponse.json({ tools: TOOLS });
}
