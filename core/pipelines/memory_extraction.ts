import { SemanticMemoryModule } from '../memory/modules/semantic';
import { StructuredMemoryModule } from '../memory/modules/structured';
import { extractDataFromText } from '@/lib/gemini-server';
import { IMemoryExtractionConfig } from '../memory/types';

interface MemoryExtractionInput {
    text: string;
    messageId: string;
    conversationId: string;
    config: IMemoryExtractionConfig;
}

export class MemoryExtractionPipeline {
    private semanticMemory: SemanticMemoryModule;
    private structuredMemory: StructuredMemoryModule;

    constructor() {
        this.semanticMemory = new SemanticMemoryModule();
        this.structuredMemory = new StructuredMemoryModule();
    }

    async run(input: MemoryExtractionInput): Promise<void> {
        const { text, config } = input;

        if (!config.enableEntityExtraction && !config.enableKnowledgeExtraction) {
            return;
        }

        try {
            const { entities, knowledge } = await extractDataFromText(text);

            const promises: Promise<any>[] = [];

            if (config.enableEntityExtraction && entities.length > 0) {
                for (const entity of entities) {
                    promises.push(this.structuredMemory.store({
                        type: 'entity',
                        data: {
                            name: entity.name,
                            type: entity.type,
                            details_json: JSON.stringify(entity.details)
                        }
                    }));
                }
            }

            if (config.enableKnowledgeExtraction && knowledge.length > 0) {
                for (const k of knowledge) {
                    promises.push(this.semanticMemory.store({ text: k }));
                }
            }

            await Promise.all(promises);
            console.log("Memory extraction pipeline completed successfully.");

        } catch (error) {
            console.error("Memory extraction pipeline failed:", error);
            // In a real app, you might want to log this to a more persistent store.
        }
    }
}
