/**
 * @fileoverview Defines the standardized interfaces and types for the LLM Provider Abstraction Layer.
 */
import type { Content } from "@google/genai";

/**
 * Represents the configuration for an AI model call.
 */
export interface IModelConfig {
    temperature?: number;
    topP?: number;
}

/**
 * A standardized representation of a message in a conversation history.
 * This is compatible with the Google GenAI SDK's `Content` type.
 */
export type HistoryContent = Content;

/**
 * Defines the contract for any LLM Provider.
 * This ensures that the core engine can interact with different AI models (e.g., Gemini, OpenAI)
 * through a consistent API.
 */
export interface ILLMProvider {
    /**
     * Generates a text-based response from the LLM based on a conversation history.
     * @param history - The sequence of messages in the conversation.
     * @param systemInstruction - The system prompt or instructions for the model.
     * @param config - Optional configuration for the model, like temperature and topP.
     * @param model - Optional model name override for this specific call.
     * @returns A promise that resolves to the generated text content as a string.
     */
    generateContent(history: HistoryContent[], systemInstruction: string, config?: IModelConfig, model?: string): Promise<string>;

    /**
     * Generates a vector embedding for a given piece of text.
     * @param text - The text to be embedded.
     * @returns A promise that resolves to an array of numbers representing the vector embedding.
     */
    generateEmbedding(text: string): Promise<number[]>;
}