import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { message, context, apiKey: userApiKey } = await request.json();

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
        const systemInstruction = `You are KitBot, a friendly AI coding assistant for Kitwork (a GitHub-like code hosting platform) with a construction cat mascot theme 🐱‍🏗️.

Current repository: ${context.repo}
Current file: ${context.currentFile}${context.repoInfo}

${context.fileContent ? `Currently viewing file content:\n\`\`\`\n${context.fileContent}\n\`\`\`` : ""}

Your role is to help users understand their code, explain functions, find bugs, suggest improvements, and answer questions about the repository.

You have full access to the repository file list above. When users ask about the repository, you can see all the files and their types/languages.

Guidelines:
- Be concise and helpful
- Use code examples when helpful
- Explain technical concepts clearly
- If you don't know something, say so
- Format code with markdown
- Be friendly and encouraging with a playful construction theme
- Use occasional cat/construction themed language (let's build this, nail down the bug, hammer out this feature, etc.)

When listing files or explaining the repo structure, reference the file list provided above.`;

        // Call Google Gemini API - using Gemini 3 Flash Preview
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
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
