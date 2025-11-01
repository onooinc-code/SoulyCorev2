import { GoogleGenAI, Content, Tool, GenerateContentResponse } from "@google/genai";

// Helper to get client
const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found. Please set GEMINI_API_KEY or API_KEY in your environment variables.");
    }
    // @google/genai-api-guideline-fix: Initialize GoogleGenAI with a named apiKey parameter.
    return new GoogleGenAI({ apiKey });
};

// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

export async function generateChatResponse(history: Content[], systemInstruction: string, modelOverride?: string) {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: modelOverride || modelName,
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text and functionCalls properties directly from the response object.
        return { text: response.text, functionCalls: response.functionCalls };
    } catch (error) {
        console.error("Error in generateChatResponse:", error);
        throw error;
    }
}

export async function generateProactiveSuggestion(history: Content[]): Promise<string | null> {
    const systemInstruction = `You are an assistant that suggests the next logical step. Based on the last two turns of conversation, suggest a concise, actionable next step for the user. Phrase it as a question or a command. Respond with only the suggestion text.`;
    const response = await generateChatResponse(history, systemInstruction);
    return response.text?.trim() || null;
}

export async function generateTitleFromHistory(history: Content[]): Promise<string | null> {
    const systemInstruction = `Based on the following conversation, generate a concise, descriptive title of 5 words or less. Respond with only the title.`;
    const response = await generateChatResponse(history, systemInstruction);
    return response.text?.trim().replace(/"/g, '') || null;
}

export async function generateSummary(text: string): Promise<string | null> {
    const systemInstruction = `Summarize the following text concisely.`;
    const response = await generateChatResponse([{ role: 'user', parts: [{ text }] }], systemInstruction);
    return response.text?.trim() || null;
}

export async function regenerateUserPrompt(promptToRewrite: string, history: Content[]): Promise<string | null> {
    const systemInstruction = `You are a prompt rewriter. The user wants to rewrite their last prompt to get a better response. Based on the conversation history and their original prompt, provide a better, clearer prompt. Respond with only the new prompt text.`;
    const newHistory = [...history, { role: 'user', parts: [{ text: `My original prompt was: "${promptToRewrite}". Please rewrite it.` }] }];
    const response = await generateChatResponse(newHistory, systemInstruction);
    return response.text?.trim() || null;
}

export async function generateEmbedding(content: string): Promise<number[]> {
    // This is a placeholder since the SDK doesn't have a direct embedding endpoint.
    // In a real app, this would call the embedding model endpoint.
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

export async function generateAgentContent(history: Content[], systemInstruction: string, tools: Tool[]): Promise<GenerateContentResponse> {
    const ai = getClient();
     try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: history,
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
            },
        });
        return response;
    } catch (error) {
        console.error("Error in generateAgentContent:", error);
        throw error;
    }
}

export async function summarizeForContext(content: string): Promise<string | null> {
    const systemInstruction = `Summarize the following text into a very short, dense paragraph suitable for providing context to an AI in a future conversation. Focus on key facts, entities, and decisions.`;
    // FIX: The variable in scope is `content`, not `text`. Changed to correctly pass the content to the AI model.
    const response = await generateChatResponse([{ role: 'user', parts: [{ text: content }] }], systemInstruction);
    return response.text?.trim() || null;
}

export async function generateConversationSummary(history: Content[]): Promise<string | null> {
    const systemInstruction = `You are a summarization assistant. Read the entire conversation and provide a concise, one-paragraph summary of the key topics, decisions, and outcomes.`;
    const response = await generateChatResponse(history, systemInstruction);
    return response.text?.trim() || null;
}

export async function shouldExtractMemory(history: Content[]): Promise<boolean> {
    const systemInstruction = `Analyze the last user message and the AI's response. Does this exchange contain significant new information, facts, entities, or relationships that are worth remembering for the long term? Answer with only 'yes' or 'no'.`;
    try {
        const response = await generateChatResponse(history, systemInstruction);
        return response.text?.toLowerCase().includes('yes') || false;
    } catch (error) {
        console.error("Error in shouldExtractMemory check:", error);
        return false;
    }
}