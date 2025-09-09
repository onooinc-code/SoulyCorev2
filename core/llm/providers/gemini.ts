/**
 * @fileoverview Concrete implementation of the ILLMProvider for Google's Gemini API.
 */
import { GoogleGenAI } from "@google/genai";
import { ILLMProvider, HistoryContent, IModelConfig } from '../types';

// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

export class GeminiProvider implements ILLMProvider {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found. Please set GEMINI_API_KEY or API_KEY in your environment variables.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * @inheritdoc
     */
    async generateContent(history: HistoryContent[], systemInstruction: string, config?: IModelConfig): Promise<string> {
        try {
            const result = await this.ai.models.generateContent({
                model: modelName,
                contents: history,
                config: {
                    systemInstruction: systemInstruction || "You are a helpful AI assistant.",
                    temperature: config?.temperature ?? 0.7,
                    topP: config?.topP ?? 0.95,
                }
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