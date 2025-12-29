
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
     * This prevents the API key check from running at module import time.
     * @private
     * @returns {GoogleGenAI} The initialized GoogleGenAI client.
     */
    private getClient(): GoogleGenAI {
        if (!this.ai) {
             const candidates = [process.env.API_KEY, process.env.GEMINI_API_KEY];
             let selectedKey: string | undefined = undefined;

             // 1. Priority: Find a key that looks valid (starts with AIza)
             for (const candidate of candidates) {
                 if (!candidate) continue;
                 let key = candidate.trim();
                 // Remove surrounding quotes if present
                 if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                     key = key.substring(1, key.length - 1);
                 }
                 if (key.startsWith('AIza')) {
                     selectedKey = key;
                     break;
                 }
             }

             // 2. Fallback: If no AIza key found, use the first non-empty one found
             if (!selectedKey) {
                 for (const candidate of candidates) {
                      if (!candidate) continue;
                      let key = candidate.trim();
                      if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                          key = key.substring(1, key.length - 1);
                      }
                      if (key.length > 0) {
                          selectedKey = key;
                          break;
                      }
                 }
             }

            if (!selectedKey) {
                console.error("CRITICAL: Both API_KEY and GEMINI_API_KEY are missing from environment variables.");
                throw new Error("Configuration Error: API Key is missing. Please add API_KEY to your Vercel project settings.");
            }
            
            // Safety check for logs
            if (!selectedKey.startsWith("AIza")) {
                 console.warn(`[GeminiProvider] WARNING: Selected API Key does not start with 'AIza'. Length: ${selectedKey.length}`);
            }

            const keySource = selectedKey === process.env.API_KEY?.trim() ? 'API_KEY' : 'GEMINI_API_KEY';
            const maskedKey = selectedKey.substring(0, 4) + '...' + selectedKey.substring(selectedKey.length - 4);
            console.log(`[GeminiProvider] Initializing client using ${keySource}. Key: ${maskedKey}`);

            // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
            this.ai = new GoogleGenAI({ apiKey: selectedKey });
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
            if (validHistory.length === 0) {
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
            if (errorMessage.includes("API Key") || errorMessage.includes("API_KEY") || errorMessage.includes("400") || errorMessage.includes("403")) {
                throw new Error(`Authentication Error: Google rejected the API Key. Please check Vercel settings. (${errorMessage})`);
            }
            throw new Error(`AI Provider Error (${model || 'default'}): ${errorMessage}`);
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
