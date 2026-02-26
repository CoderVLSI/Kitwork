import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { message, context } = await request.json();

        // Check if Google API key is configured
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    response: "KitBot requires a GOOGLE_API_KEY environment variable to work. Please add it to your .env.local file.",
                },
                { status: 200 }
            );
        }

        // Build the system instruction with context
        const systemInstruction = `You are KitBot, a friendly AI coding assistant for Kitwork (a GitHub-like code hosting platform) with a construction cat mascot theme 🐱‍🏗️.

Current repository: ${context.repo}
Current file: ${context.currentFile}

Your role is to help users understand their code, explain functions, find bugs, suggest improvements, and answer questions about the repository.

Guidelines:
- Be concise and helpful
- Use code examples when helpful
- Explain technical concepts clearly
- If you don't know something, say so
- Format code with markdown
- Be friendly and encouraging with a playful construction theme
- Use occasional cat/construction themed language (let's build this, nail down the bug, etc.)

${context.fileContent ? `The user is currently viewing a file. Use its content to answer their questions.\n\nCurrent file content:\n\`\`\`\n${context.fileContent.slice(0, 3000)}${context.fileContent.length > 3000 ? "... (truncated)" : ""}\n\`\`\`` : ""}

${context.repoContext ? `Repository context: ${context.repoContext}` : ""}`;

        // Call Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
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
        const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

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
