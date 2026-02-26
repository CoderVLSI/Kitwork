import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { message, context } = await request.json();

        // Check if Claude API key is configured
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    response: "KitBot requires an ANTHROPIC_API_KEY environment variable to work. Please add it to your .env.local file.",
                },
                { status: 200 }
            );
        }

        // Build the system prompt with context
        const systemPrompt = `You are KitBot, a friendly AI coding assistant for Kitwork (a GitHub-like code hosting platform).

Current repository: ${context.repo}
Current file: ${context.currentFile}

Your role is to help users understand their code, explain functions, find bugs, suggest improvements, and answer questions about the repository.

Guidelines:
- Be concise and helpful
- Use code examples when helpful
- Explain technical concepts clearly
- If you don't know something, say so
- Format code with markdown
- Be friendly and encouraging

${context.fileContent ? `The user is currently viewing a file. Use its content to answer their questions.` : ""}

${context.repoContext ? `Repository context: ${context.repoContext}` : ""}`;

        // Call Claude API
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 2000,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: message,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Claude API error:", error);
            return NextResponse.json(
                {
                    response: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
                },
                { status: 200 }
            );
        }

        const data = await response.json();
        const assistantMessage = data.content[0]?.text || "I couldn't generate a response.";

        return NextResponse.json({ response: assistantMessage });
    } catch (error) {
        console.error("KitBot error:", error);
        return NextResponse.json(
            {
                response: "Something went wrong. Please try again.",
            },
            { status: 200 }
        );
    }
}
