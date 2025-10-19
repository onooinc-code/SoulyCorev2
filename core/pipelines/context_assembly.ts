import { EpisodicMemoryModule } from '../memory/modules/episodic';
import { SemanticMemoryModule, ISemanticQueryResult } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { GraphMemoryModule } from '../memory/modules/graph';
import llmProvider from '../llm';
import { IContextAssemblyConfig } from '../memory/types';
import type { Contact, Message, Conversation } from '@/lib/types';
import type { Content } from '@google/genai';

interface ContextAssemblyInput {
    conversation: Conversation;
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
    private graphMemory: GraphMemoryModule;

    constructor() {
        this.episodicMemory = new EpisodicMemoryModule();
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.graphMemory = new GraphMemoryModule();
    }

    async run(input: ContextAssemblyInput): Promise<AssembledContext> {
        const startTime = Date.now();
        const { conversation, userQuery, config, mentionedContacts } = input;

        // 1. Retrieve memories from all relevant modules based on conversation settings
        const episodicMemories = await this.episodicMemory.query({ conversationId: conversation.id, limit: config.episodicMemoryDepth });
        
        const semanticMemoriesPromise = conversation.useSemanticMemory
            ? this.semanticMemory.query({ queryText: userQuery, topK: config.semanticMemoryTopK })
            : Promise.resolve([]);
            
        const structuredMemoriesPromise = conversation.useStructuredMemory && mentionedContacts.length > 0
            ? this.structuredMemory.query({ type: 'contact', name: mentionedContacts[0].name })
            : Promise.resolve([]);

        // A simple heuristic to extract a potential entity name (capitalized word) from the query for the graph DB
        const potentialEntityName = userQuery.split(' ').find(word => word.length > 2 && word[0] === word[0].toUpperCase());

        const graphMemoriesPromise = (conversation.useGraphMemory && potentialEntityName)
            ? this.graphMemory.query({ entityName: potentialEntityName })
            : Promise.resolve([]);

        const [semanticMemories, structuredMemories, graphMemories] = await Promise.all([
            semanticMemoriesPromise,
            structuredMemoriesPromise,
            graphMemoriesPromise
        ]);
        
        // 2. Build the history and context string for the prompt
        const history: Content[] = episodicMemories.map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }]
        }));
        
        let contextString = "--- CONTEXT ---\n";
        let contextAdded = false;

        if (semanticMemories.length > 0) {
            contextString += "Relevant knowledge:\n" + semanticMemories.map(m => `- ${m.text}`).join('\n') + "\n\n";
            contextAdded = true;
        }
        if (structuredMemories.length > 0) {
            contextString += "Mentioned contacts:\n" + structuredMemories.map((c: Contact) => `- ${c.name}: ${c.notes || c.company || c.email}`).join('\n') + "\n\n";
            contextAdded = true;
        }
        if (graphMemories.length > 0) {
            contextString += "Related concepts:\n" + graphMemories.map(r => `- ${r}`).join('\n') + "\n\n";
            contextAdded = true;
        }
        contextString += "--- END CONTEXT ---";
        
        const finalPrompt = contextAdded ? `${contextString}\n\nUser query: ${userQuery}` : userQuery;
        history.push({ role: 'user', parts: [{ text: finalPrompt }] });

        // 3. Call the LLM
        const llmResponse = await llmProvider.generateContent(history, conversation.systemPrompt || "You are a helpful AI assistant. Use the provided context to inform your response.");
        const llmResponseTime = Date.now() - startTime;

        return {
            llmResponse,
            llmResponseTime,
            retrievedEpisodicMemories: episodicMemories,
            retrievedSemanticMemories: semanticMemories,
            retrievedStructuredMemories: structuredMemories,
        };
    }
}
