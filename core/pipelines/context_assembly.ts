import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import llmProvider from '../llm';
import { IContextAssemblyConfig } from '../memory/types';
import type { Contact, Message } from '@/lib/types';
import type { Content } from '@google/genai';

interface ContextAssemblyInput {
    conversationId: string;
    userQuery: string;
    config: IContextAssemblyConfig;
    mentionedContacts: Contact[];
    userMessageId: string;
}

interface AssembledContext {
    llmResponse: string;
    llmResponseTime: number;
    retrievedSemanticMemories: ISemanticQueryResult[];
    retrievedEpisodicMemories: Message[];
    retrievedStructuredMemories: any[];
}

export class ContextAssemblyPipeline {
    private episodicMemory: EpisodicMemoryModule;
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
    }

    async run(input: ContextAssemblyInput): Promise<AssembledContext> {
        const startTime = Date.now();

        // 1. Retrieve memories from all relevant modules
        const episodicMemories = await this.episodicMemory.query({ conversationId: input.conversationId, limit: input.config.episodicMemoryDepth });
        const semanticMemories = await this.semanticMemory.query({ queryText: input.userQuery, topK: input.config.semanticMemoryTopK });
        
        // 2. Build the history and context string for the prompt
        const history: Content[] = episodicMemories.map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }]
        }));
        
        let contextString = "--- CONTEXT ---\n";
        if (semanticMemories.length > 0) {
            contextString += "Relevant knowledge:\n" + semanticMemories.map(m => `- ${m.text}`).join('\n') + "\n\n";
        }
        if (input.mentionedContacts.length > 0) {
            contextString += "Mentioned contacts:\n" + input.mentionedContacts.map(c => `- ${c.name}: ${c.notes || c.company || c.email}`).join('\n') + "\n\n";
        }
        contextString += "--- END CONTEXT ---";
        
        const finalPrompt = contextString.length > 30 ? `${contextString}\n\nUser query: ${input.userQuery}` : input.userQuery;
        history.push({ role: 'user', parts: [{ text: finalPrompt }] });

        // 3. Call the LLM
        const llmResponse = await llmProvider.generateContent(history, "You are a helpful AI assistant. Use the provided context to inform your response.");
        const llmResponseTime = Date.now() - startTime;

        return {
            llmResponse,
            llmResponseTime,
            retrievedEpisodicMemories: episodicMemories,
            retrievedSemanticMemories: semanticMemories,
            retrievedStructuredMemories: input.mentionedContacts, // For now
        };
    }
}
