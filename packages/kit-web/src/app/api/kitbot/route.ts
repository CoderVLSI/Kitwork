import { NextRequest, NextResponse } from "next/server";

// Tool definitions for Gemini function calling
const TOOLS = [
    {
        name: "list_files",
        description: "List all files in the repository or a specific directory path",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Directory path (optional, leave empty for root)",
                },
            },
        },
    },
    {
        name: "read_file",
        description: "Read the contents of a specific file in the repository",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "File path to read (e.g., 'src/App.tsx' or 'package.json')",
                },
            },
            required: ["path"],
        },
    },
    {
        name: "write_file",
        description: "Create a new file or overwrite an existing file with content",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "File path where to write",
                },
                content: {
                    type: "string",
                    description: "Content to write to the file",
                },
                message: {
                    type: "string",
                    description: "Commit message describing the change",
                },
            },
            required: ["path", "content", "message"],
        },
    },
    {
        name: "search",
        description: "Search for text or patterns in repository files (like grep)",
        parameters: {
            type: "object",
            properties: {
                pattern: {
                    type: "string",
                    description: "Text or regex pattern to search for",
                },
                file_pattern: {
                    type: "string",
                    description: "Optional file pattern (e.g., '*.tsx', '*.ts', '*.css')",
                },
            },
            required: ["pattern"],
        },
    },
    {
        name: "commit",
        description: "Commit staged changes with a descriptive message",
        parameters: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    description: "Commit message (should be descriptive but concise)",
                },
            },
            required: ["message"],
        },
    },
    {
        name: "create_branch",
        description: "Create a new branch from the current HEAD",
        parameters: {
            type: "object",
            properties: {
                branch: {
                    type: "string",
                    description: "Name for the new branch",
                },
            },
            required: ["branch"],
        },
    },
    {
        name: "log",
        description: "Show commit history",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of commits to show (default: 10)",
                },
            },
        },
    },
    {
        name: "status",
        description: "Show the working tree status - modified, staged files, branch info",
        parameters: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "diff",
        description: "Show changes between commits or in working tree",
        parameters: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Optional file path to diff",
                },
            },
        },
    },
];

export async function POST(request: NextRequest) {
    try {
        const { message, context, apiKey: userApiKey, username, repoName, userId, model } = await request.json();
        const modelId = model || "gemini-2.5-flash-preview-05-20";

        // Use user's API key first, then fall back to environment variable
        const apiKey = userApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    response: "KitBot requires a Google API key. Please add your API key in Settings to use KitBot.",
                },
                { status: 200 }
            );
        }

        // Build the system instruction with context
        let repoInfo = "";
        if (context.repoInfo) {
            try {
                const parsed = JSON.parse(context.repoInfo);
                repoInfo = `

Repository Information:
- Description: ${parsed.description || "No description"}
- Default Branch: ${parsed.defaultBranch || "main"}
- Visibility: ${parsed.isPublic ? "Public" : "Private"}

Files in this repository (${parsed.files?.length || 0} total):
${parsed.files?.map((f: any) => `  - ${f.name} (${f.type}${f.language ? ` - ${f.language}` : ""})`).join("\n") || "  No files"}

${parsed.stats ? `Statistics:
- Languages: ${parsed.stats.languages?.map((l: any) => l.name).join(", ") || "None detected"}
- Total Files: ${parsed.stats.fileCount || 0}
- Total Commits: ${parsed.stats.commitCount || 0}
- Contributors: ${parsed.stats.contributors || 0}` : ""}`;
            } catch {
                repoInfo = context.repoInfo;
            }
        }

        const systemInstruction = `You are KitBot, a helpful AI coding assistant for Kitwork (a GitHub-like code hosting platform) with a construction cat mascot theme 🐱‍🏗️.

Current repository: ${context.repo}
Current file: ${context.currentFile}${repoInfo}

${context.fileContent ? `Currently viewing file content:\n\`\`\`\n${context.fileContent}\n\`\`\`` : ""}

You have access to Git tools through function calling. When users ask you to:
- List files: Use list_files tool
- Read a file: Use read_file tool with the file path
- Write/create a file: Use write_file tool with path, content, and commit message
- Search code: Use search tool with a pattern
- Commit changes: Use commit tool with a message
- Create branch: Use create_branch tool
- Show history: Use log tool
- Check status: Use status tool
- Show diff: Use diff tool

Always explain what you're doing before calling a tool. After getting tool results, summarize what happened.

Guidelines:
- Be concise and helpful
- Use code examples when helpful
- Explain technical concepts clearly
- If you don't know something, say so
- Format code with markdown
- Be friendly and encouraging with a playful construction theme
- Use occasional cat/construction themed language (let's build this, nail down the bug, hammer out this feature, etc.)`;

        // First call - potentially with function calls
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${systemInstruction}\n\nUser: ${message}` }
                        ]
                    }
                ],
                tools: TOOLS,
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API error:", error);
            return NextResponse.json(
                {
                    response: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
                },
                { status: 200 }
            );
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // Check if there are function calls
        const functionCalls = parts.filter((p: any) => p.functionCall);
        const textParts = parts.filter((p: any) => p.text);

        if (functionCalls.length > 0) {
            // Execute function calls
            const toolResults: any[] = [];

            for (const fc of functionCalls) {
                const func = fc.functionCall;
                const params = JSON.parse(JSON.stringify(func.args || {}));

                try {
                    // Call the tool API
                    const toolResponse = await fetch(`${request.nextUrl.origin}/api/kitbot/tools`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            tool: func.name,
                            params,
                            username,
                            repoName,
                            userId,
                        }),
                    });

                    const toolData = await toolResponse.json();
                    toolResults.push({
                        functionResponse: {
                            name: func.name,
                            response: toolData.result || toolData.error || "Done",
                        },
                    });
                } catch (error: any) {
                    toolResults.push({
                        functionResponse: {
                            name: func.name,
                            response: `Error: ${error.message}`,
                        },
                    });
                }
            }

            // Second call with tool results
            const followUpResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: `${systemInstruction}\n\nUser: ${message}` },
                                ...parts,
                                ...toolResults,
                            ],
                        }
                    ],
                    tools: TOOLS,
                    generationConfig: {
                        maxOutputTokens: 2000,
                        temperature: 0.7,
                    },
                }),
            });

            if (!followUpResponse.ok) {
                const error = await followUpResponse.text();
                console.error("Gemini follow-up error:", error);
                return NextResponse.json(
                    {
                        response: "I executed the tools but had trouble processing the results.",
                    },
                    { status: 200 }
                );
            }

            const followUpData = await followUpResponse.json();
            const followUpParts = followUpData.candidates?.[0]?.content?.parts || [];
            const followUpText = followUpParts
                .filter((p: any) => p.text)
                .map((p: any) => p.text)
                .join("");

            return NextResponse.json({
                response: followUpText || "Tool executed successfully!",
            });
        }

        // No function calls, just return the text
        const assistantMessage = textParts.map((p: any) => p.text).join("");
        return NextResponse.json({ response: assistantMessage });
    } catch (error: any) {
        console.error("KitBot error:", error);
        return NextResponse.json(
            {
                response: "Something went wrong. Please try again.",
            },
            { status: 200 }
        );
    }
}
