import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { GraphMemoryModule } from '../memory/modules/graph';
// import { UpstashVectorMemoryModule } from '../memory/modules/upstash_vector';
import { IMemoryExtractionConfig } from '../memory/types';
import { Conversation } from '@/lib/types';
import { GoogleGenAI, Type } from "@google/genai";
// import { PostgresConversationRepository } from '../repositories/PostgresConversationRepository';
import { sql } from '@/lib/db';

interface MemoryExtractionInput {
    text: string;
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found.");
    return new GoogleGenAI({ apiKey });
};

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;
    private graphMemory: GraphMemoryModule;
    // private vectorMemory: UpstashVectorMemoryModule;
    // private conversationRepo: PostgresConversationRepository;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.graphMemory = new GraphMemoryModule();
        // this.vectorMemory = new UpstashVectorMemoryModule();
        // this.conversationRepo = new PostgresConversationRepository();
    }

    private async extractData(text: string): Promise<{ entities: any[], knowledge: string[], relationships: any[] }> {
        const client = getAiClient();
        const modelName = 'gemini-2.5-flash';
        const prompt = `
            Analyze the following text. Extract three types of information:
            1.  **Entities**: Key people, places, organizations, projects, or concepts.
            2.  **Knowledge**: Distinct, self-contained facts or statements.
            3.  **Relationships**: Connections between two entities in the format [Entity1, Predicate, Entity2]. For example, [Elon Musk, is CEO of, Tesla].

            Return a single JSON object with "entities", "knowledge", and "relationships" keys.

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
                        entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, details: { type: Type.STRING } } } },
                        knowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
                        relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, predicate: { type: Type.STRING }, object: { type: Type.STRING } }, required: ['subject', 'predicate', 'object'] } }
                    },
                    required: ['entities', 'knowledge', 'relationships']
                }
            }
        });

        if (!result.text) {
            console.error("Data extraction failed: No text in response.");
            return { entities: [], knowledge: [], relationships: [] };
        }
        const jsonStr = result.text.trim();
        return JSON.parse(jsonStr);
    }

    async run(input: MemoryExtractionInput): Promise<void> {
        const { text, conversationId, config } = input;
        
        const { rows } = await sql<Conversation>`SELECT * FROM conversations WHERE id = ${conversationId}`;
        const conversation = rows[0];
        if (!conversation) {
            console.error(`Memory extraction failed: Conversation ${conversationId} not found.`);
            return;
        }

        if (!config.enableEntityExtraction && !config.enableKnowledgeExtraction && !conversation.useGraphMemory) {
            return; // Nothing to do
        }

        try {
            const { entities, knowledge, relationships } = await this.extractData(text);

            const promises: Promise<any>[] = [];

            if (config.enableEntityExtraction && entities.length > 0) {
                for (const entity of entities) {
                    promises.push(this.structuredMemory.store({ type: 'entity', data: { name: entity.name, type: entity.type, details_json: JSON.stringify(entity.details) } }));
                }
            }

            if (config.enableKnowledgeExtraction && knowledge.length > 0) {
                for (const k of knowledge) {
                    promises.push(this.semanticMemory.store({ text: k }));
                }
            }

            if (conversation.useGraphMemory && relationships && relationships.length > 0) {
                 for (const rel of relationships) {
                    promises.push(this.graphMemory.store({ relationship: { subject: rel.subject, predicate: rel.predicate, object: rel.object } }));
                }
            }

            await Promise.all(promises);
            console.log("Memory extraction pipeline completed successfully.");

        } catch (error) {
            console.error("Memory extraction pipeline failed:", error);
        }
    }
}
