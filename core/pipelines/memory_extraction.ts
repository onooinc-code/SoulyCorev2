
import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { GraphMemoryModule } from '../memory/modules/graph';
import { ProfileMemoryModule } from '../memory/modules/profile';
import { DocumentMemoryModule } from '../memory/modules/document';
import { EntityVectorMemoryModule } from '../memory/modules/entity_vector';
import { GoogleGenAI, Type } from "@google/genai";
import type { EntityDefinition } from '@/lib/types';

interface IMemoryExtractionParams {
    text: string;
    messageId: string;
    conversationId: string;
    brainId: string | null;
    config: any;
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;
    private graphMemory: GraphMemoryModule;
    private profileMemory: ProfileMemoryModule;
    private documentMemory: DocumentMemoryModule;
    private entityVectorMemory: EntityVectorMemoryModule;
    private ai: GoogleGenAI;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
        this.graphMemory = new GraphMemoryModule();
        this.profileMemory = new ProfileMemoryModule();
        this.documentMemory = new DocumentMemoryModule();
        this.entityVectorMemory = new EntityVectorMemoryModule();
        
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("API key not found.");
        this.ai = new GoogleGenAI({ apiKey });
    }

    async run(params: IMemoryExtractionParams) {
        const { text, messageId, conversationId, brainId } = params;

        // 1. Log raw interaction to MongoDB (Historical Archive)
        await this.documentMemory.store({ 
            data: { text, source: 'extraction_pipeline', messageId, conversationId, timestamp: new Date() }, 
            type: 'extraction_log' 
        });

        const prompt = `Analyze the following chat segment: "${text}"
        
        Extract and return a valid JSON object with:
        1. "entities": Array of objects {name, type, description} for people, projects, or places.
        2. "relationships": Array of {source, predicate, target} for connections.
        3. "preferences": Array of strings for user-specific likes/dislikes/settings.
        4. "facts": Array of strings for general reusable knowledge.
        
        Ensure the JSON is strictly valid.`;

        try {
             const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview', // High speed for background extraction
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, type: {type: Type.STRING}, description: {type: Type.STRING} } } },
                            relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, predicate: {type: Type.STRING}, target: {type: Type.STRING} } } },
                            preferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                            facts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['entities', 'relationships', 'preferences', 'facts']
                    }
                }
            });

            if (!response.text) return;
            const data = JSON.parse(response.text.trim());

            // A. Store User Preferences (Postgres Settings)
            if (data.preferences?.length > 0) {
                for(const pref of data.preferences) {
                    await this.profileMemory.store({ preference: pref });
                }
            }

            // B. Store Knowledge Facts (Pinecone - Semantic Search)
            if (data.facts?.length > 0) {
                for(const fact of data.facts) {
                    await this.semanticMemory.store({ text: fact, metadata: { conversationId, type: 'fact' } });
                }
            }

            // C. Store Entities (Postgres Structured + Upstash Vector)
            if (data.entities?.length > 0) {
                for(const entity of data.entities) {
                    const saved: EntityDefinition = await this.structuredMemory.store({ 
                        type: 'entity', 
                        data: { ...entity, brainId } 
                    });
                    
                    if (saved?.id) {
                        // Link Postgres ID to Upstash Vector for fast similarity lookup
                        await this.entityVectorMemory.store({ 
                            id: saved.id, 
                            text: `${saved.name} (${saved.type}): ${saved.description}` 
                        });
                    }
                }
            }

            // D. Store Relationships (EdgeDB Graph)
            if (data.relationships?.length > 0) {
                for(const rel of data.relationships) {
                    try {
                        await this.graphMemory.store({
                            relationship: {
                                subject: rel.source,
                                predicate: rel.predicate,
                                object: rel.target
                            }
                        });
                    } catch (e) { console.error("EdgeDB link failed", e); }
                }
            }

        } catch (error) {
            console.error("MemoryExtractionPipeline failed:", error);
        }
    }
}
