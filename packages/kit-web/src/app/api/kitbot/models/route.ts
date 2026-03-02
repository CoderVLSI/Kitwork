import { NextRequest, NextResponse } from "next/server";

type Provider = "google" | "openrouter";

interface ModelOption {
    id: string;
    label: string;
    description: string;
}

const FALLBACK_MODELS: Record<Provider, ModelOption[]> = {
    google: [
        { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview", description: "Fast and capable" },
        { id: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro", description: "Most capable Gemini" },
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Balanced speed and quality" },
    ],
    openrouter: [
        { id: "google/gemini-2.5-flash", label: "Google Gemini 2.5 Flash", description: "Fast general-purpose model" },
        { id: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini", description: "Cost-efficient reasoning" },
        { id: "anthropic/claude-3.5-sonnet", label: "Anthropic Claude 3.5 Sonnet", description: "High quality coding and analysis" },
    ],
};

function normalizeProvider(value: unknown): Provider {
    return value === "openrouter" ? "openrouter" : "google";
}

function uniqueModels(models: ModelOption[]): ModelOption[] {
    const seen = new Set<string>();
    const unique: ModelOption[] = [];

    for (const model of models) {
        if (!model.id || seen.has(model.id)) continue;
        seen.add(model.id);
        unique.push(model);
    }

    return unique;
}

function toLabel(id: string): string {
    return id
        .split("/")
        .pop()
        ?.split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || id;
}

function mapGoogleModels(data: any): ModelOption[] {
    const models = Array.isArray(data?.models) ? data.models : [];

    return uniqueModels(models
        .map((model: any) => {
            const fullName = typeof model?.name === "string" ? model.name : "";
            const id = fullName.startsWith("models/") ? fullName.slice("models/".length) : fullName;
            const methods = Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : [];
            const supportsGenerate = methods.includes("generateContent");

            if (!id || !supportsGenerate || !id.toLowerCase().includes("gemini")) return null;

            return {
                id,
                label: typeof model?.displayName === "string" ? model.displayName : toLabel(id),
                description: typeof model?.description === "string" && model.description
                    ? model.description.slice(0, 120)
                    : "Google Gemini model",
            };
        })
        .filter((model: ModelOption | null): model is ModelOption => Boolean(model)));
}

function mapOpenRouterModels(data: any): ModelOption[] {
    const models = Array.isArray(data?.data) ? data.data : [];

    return uniqueModels(models
        .map((model: any) => {
            const id = typeof model?.id === "string" ? model.id : "";
            if (!id) return null;

            let description = "OpenRouter model";
            if (typeof model?.description === "string" && model.description.trim()) {
                description = model.description.slice(0, 120);
            } else if (typeof model?.context_length === "number") {
                description = `Context: ${model.context_length.toLocaleString()} tokens`;
            }

            return {
                id,
                label: typeof model?.name === "string" && model.name.trim() ? model.name : toLabel(id),
                description,
            };
        })
        .filter((model: ModelOption | null): model is ModelOption => Boolean(model)));
}

export async function POST(request: NextRequest) {
    let provider: Provider = "google";
    try {
        const body = await request.json();
        provider = normalizeProvider(body?.provider);
        const userApiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

        const apiKey = provider === "openrouter"
            ? (userApiKey || process.env.OPENROUTER_API_KEY || "")
            : (userApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "");

        if (!apiKey) {
            return NextResponse.json({
                models: FALLBACK_MODELS[provider],
                source: "fallback",
                provider,
                error: provider === "openrouter"
                    ? "Missing OpenRouter API key"
                    : "Missing Google API key",
            });
        }

        if (provider === "openrouter") {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
                    "X-Title": "Kitwork KitBot",
                },
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenRouter models API failed: ${error}`);
            }

            const data = await response.json();
            const models = mapOpenRouterModels(data);

            return NextResponse.json({
                models: models.length > 0 ? models : FALLBACK_MODELS[provider],
                source: models.length > 0 ? "api" : "fallback",
                provider,
            });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google models API failed: ${error}`);
        }

        const data = await response.json();
        const models = mapGoogleModels(data);
        return NextResponse.json({
            models: models.length > 0 ? models : FALLBACK_MODELS[provider],
            source: models.length > 0 ? "api" : "fallback",
            provider,
        });
    } catch (error: any) {
        console.error("KitBot models error:", error);
        return NextResponse.json({
            models: FALLBACK_MODELS[provider],
            source: "fallback",
            provider,
            error: error?.message || "Failed to fetch model list",
        });
    }
}
