import { NextRequest, NextResponse } from "next/server";

type Provider = "google" | "openrouter";

type ToolDefinition = {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, { type: string; description: string }>;
        required?: string[];
    };
};

interface KitBotContext {
    repo?: string;
    currentFile?: string;
    fileContent?: string;
    repoInfo?: string;
}

interface KitBotRequestBody {
    message?: string;
    context?: KitBotContext;
    apiKey?: string;
    provider?: Provider;
    model?: string;
    username?: string;
    repoName?: string;
    userId?: string;
}

const DEFAULT_MODELS: Record<Provider, string> = {
    google: "gemini-3-flash-preview",
    openrouter: "google/gemini-2.5-flash",
};

const GOOGLE_FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

// Tool definitions for model function/tool calling
const TOOLS: ToolDefinition[] = [
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

const OPENAI_TOOLS = TOOLS.map((tool) => ({
    type: "function" as const,
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    },
}));

const GEMINI_TOOLS = [
    {
        functionDeclarations: TOOLS,
    },
];

function normalizeProvider(provider: unknown): Provider {
    return provider === "openrouter" ? "openrouter" : "google";
}

function safeParseObject(value: unknown): Record<string, unknown> {
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
        } catch {
            return {};
        }
    }
    if (value && typeof value === "object") {
        return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    }
    return {};
}

function stringValue(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function buildSystemInstruction(context: KitBotContext): string {
    let repoInfo = "";

    if (context.repoInfo) {
        try {
            const parsed = JSON.parse(context.repoInfo);
            repoInfo = `

Repository Information:
- Description: ${parsed.description || "No description"}
- Default Branch: ${parsed.defaultBranch || "main"}
- Visibility: ${parsed.isPublic ? "Public" : "Private"}

${Array.isArray(parsed.files)
                    ? `Files in this repository (${parsed.files.length} total):
${parsed.files.map((f: any) => `  - ${f.name} (${f.type}${f.language ? ` - ${f.language}` : ""})`).join("\n") || "  No files detected"}`
                    : `File list not preloaded. Use list_files before concluding the repository is empty.`}

${parsed.stats ? `Statistics:
- Languages: ${parsed.stats.languages?.map((l: any) => l.name).join(", ") || "None detected"}
- Total Files: ${parsed.stats.fileCount || 0}
- Total Commits: ${parsed.stats.commitCount || 0}
- Contributors: ${parsed.stats.contributors || 0}` : ""}`;
        } catch {
            repoInfo = context.repoInfo;
        }
    }

    return `You are KitBot, a helpful AI coding assistant for Kitwork (a GitHub-like code hosting platform).

Current repository: ${context.repo || "No repository selected"}
Current file: ${context.currentFile || "none"}${repoInfo}

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

Execution policy:
- Prefer taking action with tools instead of repeatedly asking for clarification.
- For short commands like "add", "do it", "start", or "done?", infer intent from recent context and proceed.
- If context is incomplete, call list_files/status first rather than assuming the repository is empty.
- Ask a clarifying question only for destructive operations or when there are multiple high-impact options.
- If asked to add/start in a new or empty repository, create a minimal starter (README.md plus one runnable entry file) and commit message.

Guidelines:
- Be concise and helpful
- Use code examples when helpful
- Explain technical concepts clearly
- If you don't know something, say so
- Format code with markdown`;
}

async function runTool(
    request: NextRequest,
    toolName: string,
    params: Record<string, unknown>,
    username?: string,
    repoName?: string,
    userId?: string
): Promise<string> {
    try {
        const toolResponse = await fetch(`${request.nextUrl.origin}/api/kitbot/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tool: toolName,
                params,
                username,
                repoName,
                userId,
            }),
        });

        const toolData = await toolResponse.json();
        const result = toolData?.result ?? toolData?.error ?? "Done";
        return typeof result === "string" ? result : JSON.stringify(result);
    } catch (error: any) {
        return `Error: ${error.message}`;
    }
}

function extractGeminiText(responseData: any): string {
    const parts = responseData?.candidates?.[0]?.content?.parts || [];
    return parts
        .filter((p: any) => typeof p?.text === "string")
        .map((p: any) => p.text)
        .join("");
}

function extractOpenRouterText(responseData: any): string {
    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .join("");
    }
    return "";
}

function extractApiErrorMessage(rawError: string): string {
    try {
        const parsed = JSON.parse(rawError);
        if (typeof parsed?.error?.message === "string" && parsed.error.message.trim()) {
            return parsed.error.message.trim();
        }
        if (typeof parsed?.message === "string" && parsed.message.trim()) {
            return parsed.message.trim();
        }
        if (typeof parsed?.error === "string" && parsed.error.trim()) {
            return parsed.error.trim();
        }
    } catch {
        // Raw response is not JSON, return normalized text below.
    }

    const normalized = rawError.replace(/\s+/g, " ").trim();
    if (!normalized) return "Unknown provider error.";
    return normalized.length > 280 ? `${normalized.slice(0, 277)}...` : normalized;
}

function shouldRetryGeminiWithFallback(rawError: string): boolean {
    const text = extractApiErrorMessage(rawError).toLowerCase();
    return (
        text.includes("not found") ||
        text.includes("not supported") ||
        text.includes("does not support") ||
        text.includes("permission denied") ||
        text.includes("not allowed") ||
        text.includes("model")
    );
}

function explainGeminiError(rawError: string, selectedModel: string): string {
    const detail = extractApiErrorMessage(rawError);
    const text = detail.toLowerCase();

    if (text.includes("api key not valid") || text.includes("invalid api key") || text.includes("permission denied")) {
        return `Google API key looks invalid or unauthorized. (${detail})`;
    }

    if (text.includes("quota") || text.includes("rate limit") || text.includes("resource exhausted")) {
        return `Google API quota/rate limit reached for this key. (${detail})`;
    }

    if (text.includes("model") && (text.includes("not found") || text.includes("not supported") || text.includes("does not support"))) {
        return `This key cannot use ${selectedModel}. Switch to Gemini 2.0 Flash or use OpenRouter free models. (${detail})`;
    }

    return `Google API error: ${detail}`;
}

function explainOpenRouterError(rawError: string, selectedModel: string): string {
    const detail = extractApiErrorMessage(rawError);
    const text = detail.toLowerCase();

    if (text.includes("invalid") && text.includes("key")) {
        return `OpenRouter API key looks invalid. (${detail})`;
    }

    if (text.includes("quota") || text.includes("rate") || text.includes("credits")) {
        return `OpenRouter quota/credits issue. (${detail})`;
    }

    if (text.includes("model") && (text.includes("not found") || text.includes("not available") || text.includes("does not exist"))) {
        return `Selected model (${selectedModel}) is unavailable on OpenRouter. (${detail})`;
    }

    return `OpenRouter API error: ${detail}`;
}

async function runGeminiWithFallback(
    apiKey: string,
    selectedModel: string,
    body: Record<string, unknown>,
): Promise<{ ok: true; data: any; usedModel: string } | { ok: false; error: string }> {
    const attempted = new Set<string>();
    const candidates = [selectedModel, ...GOOGLE_FALLBACK_MODELS].filter((model) => {
        if (!model || attempted.has(model)) return false;
        attempted.add(model);
        return true;
    });

    let lastError = "Google API call failed";

    for (let i = 0; i < candidates.length; i += 1) {
        const model = candidates[i];
        const response = await callGemini(apiKey, model, body);
        if (response.ok) {
            const data = await response.json();
            return { ok: true, data, usedModel: model };
        }

        const rawError = await response.text();
        lastError = rawError;
        console.error(`Gemini API error (${model}):`, rawError);

        const canRetry = i < candidates.length - 1 && shouldRetryGeminiWithFallback(rawError);
        if (!canRetry) {
            break;
        }
    }

    return { ok: false, error: lastError };
}

async function callGemini(apiKey: string, model: string, body: Record<string, unknown>) {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
}

async function callOpenRouter(apiKey: string, body: Record<string, unknown>, fallbackOrigin: string) {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin,
            "X-Title": "Kitwork KitBot",
        },
        body: JSON.stringify(body),
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as KitBotRequestBody;
        const message = stringValue(body.message).trim();

        if (!message) {
            return NextResponse.json({ response: "Please enter a message." }, { status: 200 });
        }

        const provider = normalizeProvider(body.provider);
        const model = stringValue(body.model).trim() || DEFAULT_MODELS[provider];
        const userApiKey = stringValue(body.apiKey).trim();

        const apiKey = provider === "openrouter"
            ? (userApiKey || process.env.OPENROUTER_API_KEY || "")
            : (userApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "");

        if (!apiKey) {
            const response = provider === "openrouter"
                ? "KitBot requires an OpenRouter API key. Add it in Settings to use OpenRouter models."
                : "KitBot requires a Google API key. Add it in Settings to use Google Gemini models.";
            return NextResponse.json({ response }, { status: 200 });
        }

        const context: KitBotContext = body.context || {};
        const username = stringValue(body.username) || undefined;
        const repoName = stringValue(body.repoName) || undefined;
        const userId = stringValue(body.userId) || undefined;
        const systemInstruction = buildSystemInstruction(context);

        if (provider === "openrouter") {
            const initialMessages = [
                { role: "system", content: systemInstruction },
                { role: "user", content: message },
            ];

            const firstResponse = await callOpenRouter(apiKey, {
                model,
                messages: initialMessages,
                tools: OPENAI_TOOLS,
                tool_choice: "auto",
                temperature: 0.7,
                max_tokens: 2000,
            }, request.nextUrl.origin);

            if (!firstResponse.ok) {
                const error = await firstResponse.text();
                console.error("OpenRouter API error:", error);
                return NextResponse.json(
                    { response: explainOpenRouterError(error, model) },
                    { status: 200 }
                );
            }

            const firstData = await firstResponse.json();
            const assistantMessage = firstData?.choices?.[0]?.message;
            const toolCalls = Array.isArray(assistantMessage?.tool_calls) ? assistantMessage.tool_calls : [];

            if (toolCalls.length > 0) {
                const toolMessages: Array<{ role: "tool"; tool_call_id: string; content: string }> = [];

                for (let i = 0; i < toolCalls.length; i += 1) {
                    const call = toolCalls[i];
                    const toolName = stringValue(call?.function?.name);
                    if (!toolName) continue;

                    const args = safeParseObject(call?.function?.arguments);
                    const toolResult = await runTool(request, toolName, args, username, repoName, userId);
                    toolMessages.push({
                        role: "tool",
                        tool_call_id: stringValue(call?.id) || `tool_call_${i}`,
                        content: toolResult,
                    });
                }

                const secondResponse = await callOpenRouter(apiKey, {
                    model,
                    messages: [
                        ...initialMessages,
                        {
                            role: "assistant",
                            content: assistantMessage?.content || "",
                            tool_calls: toolCalls,
                        },
                        ...toolMessages,
                    ],
                    tools: OPENAI_TOOLS,
                    tool_choice: "auto",
                    temperature: 0.7,
                    max_tokens: 2000,
                }, request.nextUrl.origin);

                if (!secondResponse.ok) {
                    const error = await secondResponse.text();
                    console.error("OpenRouter follow-up error:", error);
                    return NextResponse.json(
                        { response: explainOpenRouterError(error, model) },
                        { status: 200 }
                    );
                }

                const secondData = await secondResponse.json();
                const followUpText = extractOpenRouterText(secondData);
                return NextResponse.json({
                    response: followUpText || "Tool executed successfully.",
                });
            }

            const assistantText = extractOpenRouterText(firstData);
            return NextResponse.json({ response: assistantText || "No response generated." });
        }

        const firstBody: Record<string, unknown> = {
            contents: [
                {
                    parts: [
                        { text: `${systemInstruction}\n\nUser: ${message}` },
                    ],
                },
            ],
            tools: GEMINI_TOOLS,
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.7,
            },
        };

        const firstResult = await runGeminiWithFallback(apiKey, model, firstBody);
        if (!firstResult.ok) {
            return NextResponse.json(
                { response: explainGeminiError(firstResult.error, model) },
                { status: 200 }
            );
        }

        const usedGoogleModel = firstResult.usedModel;
        const firstData = firstResult.data;
        const parts = firstData?.candidates?.[0]?.content?.parts || [];
        const functionCalls = parts.filter((p: any) => p?.functionCall);

        if (functionCalls.length > 0) {
            const toolResults: any[] = [];

            for (const fc of functionCalls) {
                const toolName = stringValue(fc?.functionCall?.name);
                if (!toolName) continue;

                const params = safeParseObject(fc?.functionCall?.args);
                const toolResult = await runTool(request, toolName, params, username, repoName, userId);
                toolResults.push({
                    functionResponse: {
                        name: toolName,
                        response: { result: toolResult },
                    },
                });
            }

            const secondBody: Record<string, unknown> = {
                contents: [
                    {
                        parts: [
                            { text: `${systemInstruction}\n\nUser: ${message}` },
                            ...parts,
                            ...toolResults,
                        ],
                    },
                ],
                tools: GEMINI_TOOLS,
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                },
            };

            const secondResult = await runGeminiWithFallback(apiKey, usedGoogleModel, secondBody);
            if (!secondResult.ok) {
                return NextResponse.json(
                    { response: explainGeminiError(secondResult.error, usedGoogleModel) },
                    { status: 200 }
                );
            }

            const secondData = secondResult.data;
            const followUpText = extractGeminiText(secondData);
            return NextResponse.json({ response: followUpText || "Tool executed successfully." });
        }

        const assistantMessage = extractGeminiText(firstData);
        return NextResponse.json({ response: assistantMessage || "No response generated." });
    } catch (error: any) {
        console.error("KitBot error:", error);
        return NextResponse.json(
            { response: "Something went wrong. Please try again." },
            { status: 200 }
        );
    }
}
