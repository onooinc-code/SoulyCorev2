
// core/pipelines/memory_extraction.ts
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

        await this.documentMemory.store({ 
            data: { text, source: 'extraction_pipeline', messageId, conversationId, brainId, timestamp: new Date() }, 
            type: 'extraction_log' 
        });

        // ENHANCED PROMPT: Stronger instructions for Arabic and Personal Identity
        const prompt = `Analyze the conversation turn: "${text}"
        Extract structured knowledge in JSON format. 
        IMPORTANT: The text might be in Arabic (Egyptian/Standard). Handle it correctly.

        Categories to extract:
        1. "aiIdentity": { "name": string } - If the user tells the AI its name (e.g. "اسمك سولي").
        2. "userProfile": { "name": string, "role": string, "preferences": string[] } - If user shares their info.
        3. "entities": { "name": string, "type": string, "description": string }[] - People, tech, locations.
        4. "relationships": { "source": string, "predicate": string, "target": string }[]
        5. "facts": string[] - General knowledge or business facts.

        Return ONLY JSON.`;

        try {
             const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            aiIdentity: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } },
                            userProfile: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    name: { type: Type.STRING }, 
                                    role: { type: Type.STRING }, 
                                    preferences: { type: Type.ARRAY, items: { type: Type.STRING } } 
                                } 
                            },
                            entities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, type: {type: Type.STRING}, description: {type: Type.STRING} } } },
                            relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, predicate: {type: Type.STRING}, target: {type: Type.STRING} } } },
                            facts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            if (!response.text) return;
            const data = JSON.parse(response.text.trim());

            // A. Identity Sync (Auto-Save)
            if (data.aiIdentity?.name) {
                await this.profileMemory.store({ aiName: data.aiIdentity.name });
            }
            if (data.userProfile) {
                await this.profileMemory.store({ 
                    name: data.userProfile.name, 
                    role: data.userProfile.role, 
                    preferences: data.userProfile.preferences 
                });
            }

            // B. Semantic & Entities (Standard extraction)
            if (data.facts?.length > 0) {
                for(const fact of data.facts) {
                    await this.semanticMemory.store({ text: fact, metadata: { conversationId, brainId, type: 'fact' } });
                }
            }

            if (data.entities?.length > 0) {
                for(const entity of data.entities) {
                    const saved: EntityDefinition = await this.structuredMemory.store({ type: 'entity', data: { ...entity, brainId } });
                    if (saved?.id) {
                        await this.entityVectorMemory.store({ id: saved.id, text: `${saved.name}: ${saved.description}`, metadata: { brainId } });
                    }
                }
            }

        } catch (error) {
            console.error("MemoryExtractionPipeline failed:", error);
        }
    }
}
