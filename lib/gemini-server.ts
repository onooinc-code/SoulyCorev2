import { GoogleGenAI, Type, GenerateContentResponse, Content, Tool, FunctionDeclaration } from "@google/genai";
import { Message } from '@/lib/types';

let ai: GoogleGenAI | null = null;

// This function lazily initializes the GoogleGenAI client as a singleton.
const getAiClient = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API key not found. Please set GEMINI_API_KEY or API_KEY in your environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};


// @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for general text tasks.
const modelName = 'gemini-2.5-flash';

export const generateEmbedding = async (text: string): Promise<number[]> => {
    // NOTE: As the GenAI SDK does not have a dedicated embedding endpoint, this function simulates
    // the embedding process. In a production scenario with a specific embedding model, this
    // would be replaced with a direct API call to that model.
    console.warn("`generateEmbedding` is a placeholder. Using a simulated text-hash-based embedding.");
    
    // Simple hashing to create a deterministic vector from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    const embedding = Array(768).fill(0).map((_, i) => {
        // Create a pseudo-random but deterministic vector based on the hash
        return Math.sin(hash + i * 0.1);
    });

    return embedding;
};


export const generateChatResponse = async (
    history: Content[],
    systemInstruction: string,
    config?: { temperature?: number, topP?: number }
): Promise<GenerateContentResponse | null> => {
    try {
        const client = getAiClient();
        const result = await client.models.generateContent({
            model: modelName,
            contents: history,
            config: {
                systemInstruction: systemInstruction || "You are a helpful AI assistant.",
                temperature: config?.temperature ?? 0.7,
                topP: config?.topP ?? 0.95,
            }
        });
        return result;
    } catch (e) {
        console.error("Chat generation failed:", e);
        return null;
    }
};

/**
 * Generates content from the Gemini model with support for function calling tools.
 * @param history The conversation history.
 * @param systemInstruction The system instruction for the agent.
 * @param tools The list of available tools for the model.
 * @param config Optional model configuration.
 * @returns The full GenerateContentResponse from the API.
 */
export const generateAgentContent = async (
    history: Content[],
    systemInstruction: string,
    tools?: Tool[],
    config?: { temperature?: number, topP?: number }
): Promise<GenerateContentResponse | null> => {
    try {
        const client = getAiClient();
        const result = await client.models.generateContent({
            model: modelName,
            contents: history,
            config: {
                systemInstruction: systemInstruction || "You are a helpful AI agent.",
                temperature: config?.temperature ?? 0.7,
                topP: config?.topP ?? 0.95,
                ...(tools && { tools: tools }),
            }
        });
        return result;
    } catch (e) {
        console.error("Agent content generation failed:", e);
        return null;
    }
};

export const extractDataFromText = async (text: string): Promise<{ entities: any[], knowledge: string[] }> => {
    try {
        const client = getAiClient();
        const prompt = `
            From the following text, perform two tasks:
            1. Extract key entities (people, places, organizations, projects, concepts).
            2. Extract distinct, self-contained chunks of information that could be useful knowledge for the future.
            
            Return the result as a single JSON object with two keys: "entities" and "knowledge".
            - "entities" should be an array of objects, each with "name", "type", and "details" properties.
            - "knowledge" should be an array of strings. Do not extract trivial statements.

            Text:
            ---
            ${text}
            ---
        `;

        const result = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        entities: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    details: { type: Type.STRING }
                                },
                                required: ['name', 'type', 'details']
                            }
                        },
                        knowledge: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['entities', 'knowledge']
                }
            }
        });
        
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        if (!result || !result.text) {
            console.error("Data extraction failed: No text in response.");
            return { entities: [], knowledge: [] };
        }
        const jsonStr = result.text.trim();
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("Data extraction failed:", e);
        return { entities: [], knowledge: [] };
    }
};

export const generateProactiveSuggestion = async (history: Content[]): Promise<string | null> => {
    if (history.length < 2) return null; // Needs at least one user/model exchange

    try {
           const client = getAiClient();
           const conversationHistoryText = history
                .slice(-4)
                .filter((m): m is { role: string; parts: { text: string }[] } => 
                    typeof m === 'object' && m !== null && Array.isArray(m.parts) && m.parts.length > 0
                )
                .map(m => `${m.role}: ${m.parts[0].text}`)
                .join('\n');

           const prompt = `Based on the last few messages of this conversation, suggest a relevant proactive action. For example, if they are talking about a person, suggest mentioning them with @. If they discuss planning, suggest creating a task. Be concise and phrase it as a question. If no action is obvious, return an empty string. Conversation:\n\n${conversationHistoryText}`;

           const result = await client.models.generateContent({ model: modelName, contents: prompt });
           // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
           if (!result || !result.text) {
            return null;
           }
           return result.text.trim() || null;

    } catch(e) {
        console.error("Suggestion generation failed:", e);
        return null;
    }
}

export const generateTitleFromHistory = async (history: Content[]): Promise<string | null> => {
    if (history.length === 0) return null;

    try {
        const client = getAiClient();
        const conversationHistoryText = history
            .filter((m): m is { role: string; parts: { text: string }[] } =>
                typeof m === 'object' && m !== null && Array.isArray(m.parts) && m.parts.length > 0
            )
            .map(m => `${m.role}: ${m.parts[0].text}`)
            .join('\n');
        
        const prompt = `Based on the following conversation, create a short and concise title (5 words or less). Do not add quotes or any other formatting.\n\n---\n\n${conversationHistoryText}`;

        const result = await client.models.generateContent({ model: modelName, contents: prompt });
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        if (!result || !result.text) {
            return null;
        }
        return result.text.trim().replace(/["']/g, ""); // Remove quotes

    } catch(e) {
        console.error("Title generation failed:", e);
        return null;
    }
};

export const generateSummary = async (text: string): Promise<string | null> => {
    try {
        const client = getAiClient();
        const prompt = `Provide a concise summary of the following text:\n\n---\n\n${text}`;
        const result = await client.models.generateContent({ model: modelName, contents: prompt });
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        return result?.text?.trim() || null;
    } catch (e) {
        console.error("Summary generation failed:", e);
        return null;
    }
};

export const regenerateUserPrompt = async (
    promptToRewrite: string,
    history: Content[]
): Promise<string | null> => {
    try {
        const client = getAiClient();
        const conversationHistoryText = history
            .filter((m): m is { role: string; parts: { text: string }[] } =>
                typeof m === 'object' && m !== null && Array.isArray(m.parts) && m.parts.length > 0
            )
            .map(m => `${m.role}: ${m.parts[0].text}`)
            .join('\n');
        
        const prompt = `
            Based on the following conversation history, professionally rewrite the user's final message.
            The rewritten message should be clearer, more effective, and maintain the original intent.
            Return ONLY the rewritten message text, without any additional explanation, formatting, or quotation marks.

            Conversation History:
            ---
            ${conversationHistoryText}
            ---

            User's message to rewrite: "${promptToRewrite}"
        `;

        const result = await client.models.generateContent({ model: modelName, contents: prompt });
        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        if (!result || !result.text) {
            return null;
        }
        return result.text.trim();

    } catch (e) {
        console.error("User prompt regeneration failed:", e);
        return null;
    }
};

export const generateTagsForMessage = async (text: string): Promise<string[] | null> => {
    try {
        const client = getAiClient();
        const prompt = `
            Analyze the following text and generate a list of relevant tags.
            Tags should be single words, lowercase, and classify the message's intent or key topics (e.g., question, decision, task, idea, summary, code, analysis).
            Return the result as a single JSON object with one key: "tags", which should be an array of strings.
            If no specific tags apply, return an empty array.

            Text:
            ---
            ${text}
            ---
        `;

        const result = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['tags']
                }
            }
        });
        
        if (!result || !result.text) {
            console.error("Tag generation failed: No text in response.");
            return null;
        }
        const jsonStr = result.text.trim();
        const parsed = JSON.parse(jsonStr);
        return parsed.tags || null;

    } catch (e) {
        console.error("Tag generation failed:", e);
        return null;
    }
};