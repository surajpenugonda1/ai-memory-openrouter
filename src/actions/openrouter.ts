"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type OpenRouterModel = {
    id: string;
    name: string;
    context_length: number;
    pricing: {
        prompt: string;
        completion: string;
        image: string;
        request: string;
    };
    isPremium: boolean;
};

/**
 * Fetches models dynamically from OpenRouter and classifies them as Premium or Normal
 * based on their prompt/completion pricing.
 */
export async function getOpenRouterModels(): Promise<OpenRouterModel[]> {
    try {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            throw new Error("Failed to fetch models from OpenRouter");
        }

        const json = await res.json();

        interface OpenRouterModelResponse {
            id: string;
            name: string;
            context_length: number;
            pricing: { prompt: string; completion: string; image: string; request: string };
            architecture?: { modality?: string };
        }

        const modelsRaw = json.data as OpenRouterModelResponse[];

        const ALLOWED_PROVIDERS = [
            'openai/',
            'anthropic/',
            'deepseek/',
            'minimax/',
            'x-ai/',
            'zhipuai/', // GLM models
        ];

        // Filter to only text generation models from requested providers
        return modelsRaw
            .filter((m) => {
                const isText = m.architecture?.modality?.includes("text");
                const isAllowedProvider = ALLOWED_PROVIDERS.some(prefix => m.id.startsWith(prefix));
                return isText && isAllowedProvider;
            })
            .map((model) => {
                // Calculate if premium based on pricing
                // If the prompt or completion token price is greater than 0, it's premium
                const promptPrice = parseFloat(model.pricing.prompt || "0");
                const completionPrice = parseFloat(model.pricing.completion || "0");
                const isPremium = promptPrice > 0 || completionPrice > 0;

                return {
                    id: model.id,
                    name: model.name,
                    context_length: model.context_length,
                    pricing: model.pricing,
                    isPremium,
                };
            })
            // Sort: Normal (Free) models first, then by name
            .sort((a, b) => {
                if (a.isPremium === b.isPremium) {
                    return a.name.localeCompare(b.name);
                }
                return a.isPremium ? 1 : -1;
            });
    } catch (error) {
        console.error("Error fetching OpenRouter models:", error);
        return [];
    }
}

/**
 * Server action to fetch the current user's usage counts from PostgreSQL
 */
export async function getUserUsage(userId: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                normalMessageCount: true,
                premiumMessageCount: true,
                isPremium: true
            }
        });

        if (!user) throw new Error("User not found");

        return {
            normalMessageCount: user.normalMessageCount,
            premiumMessageCount: user.premiumMessageCount,
            isPremium: user.isPremium

            // Example artificial limits for the UI (you can adjust these later)
            // limitNormal: 50,
            // limitPremium: user.isPremium ? 100 : 5
        };
    } catch (error) {
        console.error("Error fetching user usage:", error);
        return null;
    }
}
