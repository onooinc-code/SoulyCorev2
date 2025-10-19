/**
 * @fileoverview Server-side utilities for interacting with the Google Gemini API.
 * This file centralizes all calls to the GenAI SDK, ensuring consistent
 * error handling, model selection, and configuration.
 */

import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";

/**
 * Lazily initializes and returns a singleton instance of the GoogleGenAI client.
 * This ensures the API key is read from environment variables only when needed.
 * @returns {GoogleGenAI} The initialized GoogleGenAI client.
 */
function getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key not found. Please set GEMINI_API_KEY or API_KEY in your environment variables.");
    }
    // @google/genai-api-guideline-fix: Use named parameter for apiKey during initialization.
    return new GoogleGenAI({ apiKey });
}

/**
 * Generates a text response from a given history and system instruction.
 * @param history The conversation history.
 * @param systemInstruction The system prompt for the AI.
 * @returns The AI's text response.
 */
export async function generateChatResponse(history: Content[], systemInstruction: string): Promise<GenerateContentResponse> {
    const ai = getAiClient();
    try {
        // @google/genai-api-guideline-fix: Use gemini-2.5-flash for basic text tasks.
        const model = 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model,
            contents: history,
            config: {
                systemInstruction: systemInstruction || "You are a helpful AI assistant.",
            },
        });
        return response;
    } catch (error) {
        console.error('Error in generateChatResponse:', error);
        throw error;
    }
}

/**
 * Generates a proactive suggestion based on the last few messages in a conversation.
 * @param history The recent conversation history.
 * @returns A string with a suggested next action, or null.
 */
export async function generateProactiveSuggestion(history: Content[]): Promise<string | null> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const contents: Content[] = [
        ...history,
        {
            role: 'user',
            parts: [{ text: 'Based on our conversation, suggest a logical next step or action I could take. Be very concise and actionable. If no clear action is obvious, say "NULL".' }]
        }
    ];

    try {
        const response = await ai.models.generateContent({ model, contents });
        // @google/genai-api-guideline-fix: Access the text property directly from the response.
        const suggestion = response.text?.trim();
        if (!suggestion || suggestion.toUpperCase() === 'NULL') {
            return null;
        }
        return suggestion;
    } catch (error) {
        console.error('Error generating proactive suggestion:', error);
        return null;
    }
}

/**
 * Generates a concise title for a conversation based on its history.
 * @param history The full conversation history.
 * @returns A short, descriptive title as a string.
 */
export async function generateTitleFromHistory(history: Content[]): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const contents: Content[] = [
        ...history,
        { role: 'user', parts: [{ text: "Summarize our conversation into a short, descriptive title of 5 words or less. Do not include any punctuation or quotation marks." }] }
    ];

    const response = await ai.models.generateContent({ model, contents });
    // @google/genai-api-guideline-fix: Access the text property directly from the response.
    return response.text?.trim().replace(/["'.]/g, '') || 'Untitled Chat';
}

/**
 * Generates a detailed summary for a conversation.
 * @param history The conversation history to summarize.
 * @returns A detailed summary of the conversation.
 */
export async function generateConversationSummary(history: Content[]): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const prompt = `Based on the following conversation history, create a concise but comprehensive summary. The summary should capture the main topics, key decisions, and any action items discussed. Aim for a well-structured paragraph.

Conversation History:
---
${history.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}
---

Summary:`;
    
    const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
    const response = await ai.models.generateContent({ model, contents });
    return response.text?.trim() || 'Summary could not be generated.';
}

/**
 * Generates a summary for a given block of text.
 * @param text The text to summarize.
 * @returns A summary of the text.
 */
export async function generateSummary(text: string): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const contents: Content[] = [{ role: 'user', parts: [{ text: `Please provide a concise summary of the following text:\n\n${text}` }] }];

    const response = await ai.models.generateContent({ model, contents });
    // @google/genai-api-guideline-fix: Access the text property directly from the response.
    return response.text?.trim() || 'Could not generate summary.';
}

/**
 * Generates an extremely concise summary of a text block, specifically for use as context.
 * The goal is to preserve the core meaning in as few tokens as possible.
 * @param text The text to summarize.
 * @returns A very short summary of the text.
 */
export async function summarizeForContext(text: string): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash'; // Fast and efficient for this task
    const prompt = `Create a highly condensed summary of the following text. The summary must capture the absolute core concepts and be as short as possible for use as a memory cue in a future AI prompt.
    
    Text to summarize:
    ---
    ${text.substring(0, 8000)}
    ---
    
    Condensed Summary:`;

    const contents: Content[] = [{ role: 'user', parts: [{ text: prompt }] }];
    const response = await ai.models.generateContent({ model, contents });
    // @google/genai-api-guideline-fix: Access the text property directly from the response.
    return response.text?.trim() || 'Summary unavailable.';
}


/**
 * Rewrites a user's prompt based on the preceding conversation history to add more context or clarity.
 * @param promptToRewrite The user's original prompt.
 * @param history The conversation history that came before the prompt.
 * @returns A rewritten, potentially more detailed prompt.
 */
export async function regenerateUserPrompt(promptToRewrite: string, history: Content[]): Promise<string> {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const contents: Content[] = [
        ...history,
        { role: 'user', parts: [{ text: `Based on our conversation history, rewrite the following user prompt to be more descriptive, specific, or clearer if needed. Just provide the rewritten prompt and nothing else.\n\nOriginal prompt: "${promptToRewrite}"` }] }
    ];

    const response = await ai.models.generateContent({ model, contents });
    // @google/genai-api-guideline-fix: Access the text property directly from the response.
    return response.text?.trim() || promptToRewrite;
}

/**
 * Generates a vector embedding for a given piece of text.
 * NOTE: This is a placeholder. The current SDK may not have a direct embedding endpoint.
 * This simulates the behavior.
 * @param text The text to embed.
 * @returns An array of numbers representing the vector embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // In a real scenario with a dedicated embedding model, you would make an API call here.
    // This is a simple hash-based simulation for demonstration purposes.
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    const embedding = Array(768).fill(0).map((_, i) => Math.sin(hash + i * 0.1));
    return embedding;
}


/**
 * Generates content from the Gemini model, specifically for use in the agent's ReAct loop.
 * This function is separate to handle the specific requirements of tool use.
 * @param history The current history of the agent's phase execution.
 * @param systemInstruction The detailed instructions for the agent's current task.
 * @param tools The list of available tools (function declarations).
 * @returns A GenerateContentResponse object.
 */
export async function generateAgentContent(history: Content[], systemInstruction: string, tools: any[]): Promise<GenerateContentResponse> {
    const ai = getAiClient();
    // @google/genai-api-guideline-fix: Use 'gemini-2.5-pro' for complex reasoning tasks like agent tool use.
    const model = 'gemini-2.5-pro';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: history,
            config: {
                systemInstruction,
                tools,
            },
        });
        return response;
    } catch (error) {
        console.error('Error in generateAgentContent:', error);
        throw error;
    }
}