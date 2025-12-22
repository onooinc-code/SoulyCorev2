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
     * This prevents the API key check from running at module import time,
     * which is crucial for compatibility with build environments like Vercel.
     * @private
     * @returns {GoogleGenAI} The initialized GoogleGenAI client.
     */
    private getClient(): GoogleGenAI {
        if (!this.ai) {
            // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
            this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        }
        return this.ai;
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (retries > 0 && (error.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded'))) {
                console.warn(`GeminiProvider 429 hit. Retrying in ${initialDelay}ms...`);
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
            
            const result = await this.executeWithRetry(async () => {
                return await client.models.generateContent({
                    model: model || defaultModelName,
                    contents: history,
                    config: {
                        systemInstruction: systemInstruction || "You are a helpful AI assistant.",
                        temperature: config?.temperature ?? 0.7,
                        topP: config?.topP ?? 0.95,
                    }
                });
            });

            // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
            if (!result || !result.text) {
                console.error("GeminiProvider: Content generation returned no text.", { result });
                throw new Error("Content generation failed to return text.");
            }

            return result.text.trim();
        } catch (e) {
            console.error("GeminiProvider: Chat generation failed:", e);
            // Re-throw to allow the caller (e.g., a pipeline) to handle the failure.
            throw new Error(`Gemini API call failed: ${(e as Error).message}`);
        }
    }

    /**
     * @inheritdoc
     */
    async generateEmbedding(text: string): Promise<number[]> {
        // This is a placeholder and doesn't need the client, but it's good practice
        // to imagine it would in a real scenario.
        // const client = this.getClient();
        
        // NOTE: This remains a placeholder as the GenAI SDK does not have a dedicated embedding endpoint.
        // In a production scenario, this would be replaced with a direct API call to an embedding model.
        // console.warn("`generateEmbedding` is a placeholder. Using a simulated text-hash-based embedding.");

        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }

        const embedding = Array(768).fill(0).map((_, i) => {
            return Math.sin(hash + i * 0.1);
        });

        return embedding;
    }
}
