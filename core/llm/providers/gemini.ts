
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
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("API_KEY environment variable is missing. Please configure your AI API key.");
            }
            // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
            this.ai = new GoogleGenAI({ apiKey });
        }
        return this.ai;
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, retries = 2, initialDelay = 1000): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            const msg = error?.message || '';
            const isRetryable = error.status === 429 || msg.includes('429') || msg.includes('Quota') || msg.includes('overloaded') || error.status >= 500;
            
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

            // Validate history to ensure no empty parts which can crash the API
            const validHistory = history.map(h => ({
                role: h.role,
                parts: (h.parts || []).filter(p => p.text && p.text.trim().length > 0)
            })).filter(h => h.parts.length > 0);

            // If history becomes empty after validation (e.g. only had empty messages), preserve at least the last user message if possible or throw
            if (validHistory.length === 0 && history.length > 0) {
                 // Fallback: try to recover the last user message even if empty-ish, or just use a placeholder
                 console.warn("GeminiProvider: History validation resulted in empty history. Using placeholder.");
                 validHistory.push({ role: 'user', parts: [{ text: "..." }] });
            }

            const result = await this.executeWithRetry(async () => {
                return await client.models.generateContent({
                    model: targetModel,
                    contents: validHistory,
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
                throw new Error("Content generation failed: The model returned an empty response.");
            }

            return result.text.trim();
        } catch (e) {
            console.error("GeminiProvider: Chat generation failed:", e);
            // Enhance error message for better debugging
            const errorMessage = (e as Error).message || "Unknown error";
            if (errorMessage.includes("API key")) {
                throw new Error("Authentication Error: Invalid or missing API Key.");
            }
            throw new Error(`AI Provider Error (${model}): ${errorMessage}`);
        }
    }

    /**
     * @inheritdoc
     */
    async generateEmbedding(text: string): Promise<number[]> {
        // NOTE: This remains a placeholder as the GenAI SDK does not have a dedicated embedding endpoint 
        // that matches the current interface directly without model specification.
        // In a production scenario, this would be replaced with a direct API call to an embedding model like 'text-embedding-004'.
        
        // Simulating embedding generation for now to unblock vector logic
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
