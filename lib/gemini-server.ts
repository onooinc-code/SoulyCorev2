
import { GoogleGenAI, Content, Tool, GenerateContentResponse } from "@google/genai";
import { sql } from '@/lib/db';
import { AppSettings, CognitiveTask } from '@/lib/types';

// Helper to get client
const getClient = () => {
    // @google/genai-api-guideline-fix: Obtained exclusively from the environment variable process.env.API_KEY.
    // Added fallback for GEMINI_API_KEY to support Vercel environment configurations.
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found. Please set API_KEY or GEMINI_API_KEY in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

// Default fallback model
const defaultModelName = 'gemini-3-flash-preview';

/**
 * Utility to fetch effective model for a specific cognitive task from DB settings.
 */
async function getEffectiveModel(task: CognitiveTask, override?: string): Promise<string> {
    if (override) return override;
    try {
        const { rows } = await sql`SELECT value FROM settings WHERE "key" = 'app_settings';`;
        if (rows.length > 0) {
            const settings = rows[0].value as AppSettings;
            const provider = settings.apiRouting?.[task];
            if (provider && provider !== 'external') return provider;
        }
    } catch (e) {
        console.warn(`Failed to fetch routing for ${task}, using default.`);
    }
    return defaultModelName;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to execute API calls with exponential backoff retry
async function executeWithRetry<T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded'))) {
            console.warn(`Gemini API 429 hit. Retrying in ${initialDelay}ms... (${retries} retries left)`);
            await delay(initialDelay);
            return executeWithRetry(operation, retries - 1, initialDelay * 2);
        }
        throw error;
    }
}

// Custom error handling function to provide user-friendly messages
const handleGeminiError = (error: unknown) => {
    const errorMessage = (error as Error).message || 'An unknown error occurred';
    console.error("Error calling Gemini API:", error);

    if (errorMessage.includes('API key was reported as leaked')) {
        throw new Error("Your API key has been compromised and revoked by Google. Please generate a new API key and update your project's environment variables.");
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded')) {
        throw new Error("AI service is currently busy (Rate Limit). Please try again in a few moments.");
    }

    throw error; // Re-throw original or other errors
};


export async function generateChatResponse(history: Content[], systemInstruction: string, modelOverride?: string, task: CognitiveTask = 'main_response') {
    const ai = getClient();
    const model = await getEffectiveModel(task, modelOverride);
    try {
        return await executeWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: model,
                contents: history,
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text and functionCalls properties directly from the response object.
            return { text: response.text, functionCalls: response.functionCalls };
        });
    } catch (error) {
        handleGeminiError(error);
    }
}

export async function generateProactiveSuggestion(history: Content[]): Promise<string | null> {
    const systemInstruction = `You are an assistant that suggests the next logical step. Based on the last two turns of conversation, suggest a concise, actionable next step for the user. Phrase it as a question or a command. Respond with only the suggestion text.`;
    const model = await getEffectiveModel('proactive_suggestions');
    try {
         const ai = getClient();
         const response = await executeWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: model,
            contents: history,
            config: { systemInstruction }
         }), 1, 1000);
         return response?.text?.trim() || null;
    } catch (e) {
        console.warn("Failed to generate proactive suggestion (non-critical):", e);
        return null;
    }
}

export async function generateTitleFromHistory(history: Content[]): Promise<string | null> {
    const systemInstruction = `Based on the following conversation, generate a concise, descriptive title of 5 words or less. Respond with only the title.`;
    try {
        const response = await generateChatResponse(history, systemInstruction, undefined, 'title_generation');
        return response?.text?.trim().replace(/"/g, '') || null;
    } catch (e) {
        return null;
    }
}

export async function generateSummary(text: string): Promise<string | null> {
    const systemInstruction = `Summarize the following text concisely.`;
    const response = await generateChatResponse([{ role: 'user', parts: [{ text }] }], systemInstruction);
    return response?.text?.trim() || null;
}

export async function regenerateUserPrompt(promptToRewrite: string, history: Content[]): Promise<string | null> {
    const systemInstruction = `You are a prompt rewriter. The user wants to rewrite their last prompt to get a better response. Based on the conversation history and their original prompt, provide a better, clearer prompt. Respond with only the new prompt text.`;
    const newHistory = [...history, { role: 'user', parts: [{ text: `My original prompt was: "${promptToRewrite}". Please rewrite it.` }] }];
    const response = await generateChatResponse(newHistory, systemInstruction);
    return response?.text?.trim() || null;
}

export async function generateEmbedding(content: string): Promise<number[]> {
    console.warn("`generateEmbedding` is a placeholder. Using a simulated text-hash-based embedding.");
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const embedding = Array(768).fill(0).map((_, i) => Math.sin(hash + i * 0.1));
    return embedding;
}

export async function generateAgentContent(history: Content[], systemInstruction: string, tools: Tool[]): Promise<GenerateContentResponse | undefined> {
    const ai = getClient();
     try {
        const response = await executeWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Force pro for agent logic
            contents: history,
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
            },
        }));
        return response;
    } catch (error) {
        handleGeminiError(error);
    }
}

export async function summarizeForContext(content: string): Promise<string | null> {
    const systemInstruction = `Summarize the following text into a very short, dense paragraph suitable for providing context to an AI in a future conversation. Focus on key facts, entities, and decisions.`;
    const response = await generateChatResponse([{ role: 'user', parts: [{ text: content }] }], systemInstruction);
    return response?.text?.trim() || null;
}

export async function generateConversationSummary(history: Content[]): Promise<string | null> {
    const systemInstruction = `You are a summarization assistant. Read the entire conversation and provide a concise, one-paragraph summary of the key topics, decisions, and outcomes.`;
    const response = await generateChatResponse(history, systemInstruction);
    return response?.text?.trim() || null;
}

export async function shouldExtractMemory(history: Content[]): Promise<boolean> {
    const systemInstruction = `Analyze the last user message and the AI's response. Does this exchange contain significant new information, facts, entities, or relationships that are worth remembering for the long term? Answer with only 'yes' or 'no'.`;
    try {
        const response = await executeWithRetry<GenerateContentResponse>(() => getClient().models.generateContent({
            model: defaultModelName,
            contents: history,
            config: { systemInstruction }
        }), 1, 1000);
        return response?.text?.toLowerCase().includes('yes') || false;
    } catch (error) {
        console.warn("Error in shouldExtractMemory check (skipping):", error);
        return false;
    }
}

export function shouldPredictLink(history: Content[]): boolean {
    if (history.length < 4) return false;
    return Math.random() < 0.2;
}
