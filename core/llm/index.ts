/**
 * @fileoverview Factory and main export for the configured LLM provider.
 * This file serves as the single entry point for the rest of the core engine
 * to access the LLM abstraction layer.
 */
import { GeminiProvider } from "./providers/gemini";
import { ILLMProvider } from "./types";

/**
 * Singleton instance of the configured LLM provider.
 * This ensures that the application uses a single, consistent instance
 * for all AI model interactions.
 */
const llmProvider: ILLMProvider = new GeminiProvider();

export default llmProvider;
