
/**
 * @fileoverview Concrete implementation of the ILLMProvider for Google's Gemini API.
 */
import { GoogleGenAI } from "@google/genai";
import { ILLMProvider, HistoryContent, IModelConfig } from '../types';

// @google/genai-api-guideline-fix: Use 'gemini-3-flash-preview' for basic text tasks.
const defaultModelName = 'gemini-3-flash-preview';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiProvider implements ILLMProvider {
    private ai: GoogleGenAI | null = null;

    /**
     * Lazily initializes and returns the GoogleGenAI client instance.
     */
    private getClient(): GoogleGenAI {
        if (!this.ai) {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("API_KEY environment variable is missing. Please configure your AI API key.");
            }
            this.ai = new GoogleGenAI({ apiKey });
        }
        return this.ai;
    }

    /**
     * Sanitizes conversation history to meet strict Gemini API requirements:
     * 1. Roles must be only 'user' or 'model'.
     * 2. Roles must strictly alternate.
     * 3. Sequence must start and end with 'user' for generateContent.
     * @private
     */
    private sanitizeHistory(history: HistoryContent[]): HistoryContent[] {
        if (!history || history.length === 0) return [];

        // 1. Normalize roles and filter empty parts
        const normalized = history.map(h => ({
            role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
            parts: (h.parts || []).filter(p => p.text && p.text.trim().length > 0)
        })).filter(h => h.parts.length > 0);

        // 2. Merge consecutive messages with the same role to ensure alternation
        const alternated: HistoryContent[] = [];
        for (const msg of normalized) {
            if (alternated.length > 0 && alternated[alternated.length - 1].role === msg.role) {
                alternated[alternated.length - 1].parts.push(...msg.parts);
            } else {
                alternated.push(msg);
            }
        }

        // 3. Trim non-user messages from start and end (API requirement for generation)
        let final = [...alternated];
        while (final.length > 0 && final[0].role !== 'user') {
            final.shift();
        }
        while (final.length > 0 && final[final.length - 1].role !== 'user') {
            final.pop();
        }

        // 4. Emergency fallback if trimming resulted in empty history
        if (final.length === 0 && alternated.length > 0) {
            return [alternated[alternated.length - 1]];
        }

        return final;
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, retries = 2, initialDelay = 1000): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            const msg = error?.message || '';
            const status = error?.status;
            // Retry on rate limits (429) or server errors (5xx)
            const isRetryable = status === 429 || msg.includes('429') || msg.includes('Quota') || msg.includes('overloaded') || (status >= 500);
            
            if (retries > 0 && isRetryable) {
                console.warn(`GeminiProvider: Retryable error (${msg}). Retrying in ${initialDelay}ms...`);
                await delay(initialDelay);
                return this.executeWithRetry(operation, retries - 1, initialDelay * 2);
            }
            throw error;
        }
    }

    /**
     * @inheritdoc
     */
    async generateContent(history: HistoryContent[], systemInstruction: string, config?: IModelConfig, model?: string): Promise<string> {
        try {
            const client = this.getClient();
            const targetModel = model || defaultModelName;

            const sanitizedHistory = this.sanitizeHistory(history);

            // If history is empty after sanitization, we can't proceed with generateContent
            if (sanitizedHistory.length === 0) {
                console.warn("GeminiProvider: History is empty after sanitization. Using system instruction only.");
                // We add a dummy user message to satisfy the API if needed, 
                // but usually this indicates a logic error upstream.
                sanitizedHistory.push({ role: 'user', parts: [{ text: "..." }] });
            }

            const result = await this.executeWithRetry(async () => {
                return await client.models.generateContent({
                    model: targetModel,
                    contents: sanitizedHistory,
                    config: {
                        systemInstruction: systemInstruction || "You are a helpful AI assistant.",
                        // Ensure temperature and topP are numbers and not null/undefined
                        temperature: (config?.temperature != null) ? Number(config.temperature) : 0.7,
                        topP: (config?.topP != null) ? Number(config.topP) : 0.95,
                    }
                });
            });

            if (!result || !result.text) {
                console.error("GeminiProvider: Content generation returned no text.", { result });
                throw new Error("The model returned an empty response.");
            }

            return result.text.trim();
        } catch (e: any) {
            console.error("GeminiProvider: Chat generation failed:", e);
            const errorMessage = e?.message || "Unknown provider error";
            
            // Provide more actionable details for common errors
            if (errorMessage.includes("400") || errorMessage.includes("invalid")) {
                throw new Error(`Invalid Request: The AI engine rejected the conversation structure. (Details: ${errorMessage})`);
            }
            if (errorMessage.includes("404") || errorMessage.includes("not found")) {
                throw new Error(`Model Error: The selected AI model '${model || defaultModelName}' was not found.`);
            }

            throw new Error(`AI Provider Error: ${errorMessage}`);
        }
    }

    /**
     * @inheritdoc
     */
    async generateEmbedding(text: string): Promise<number[]> {
        // Simple hash-based simulation for now
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Array(768).fill(0).map((_, i) => Math.sin(hash + i * 0.1));
    }
}
