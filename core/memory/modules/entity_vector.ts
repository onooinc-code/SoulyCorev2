/**
 * @fileoverview Implements the Entity Vector Memory Module using Upstash Vector.
 * This module is responsible for storing and retrieving entities based on conceptual similarity.
 */

import { Index } from "@upstash/vector";
import { ISingleMemoryModule } from '../types';
import llmProvider from '@/core/llm';
import { v4 as uuidv4 } from 'uuid';

interface IVectorMemoryStoreParams {
    id?: string;
    text: string;
    metadata?: Record<string, any>;
}

interface IVectorMemoryQueryParams {
    queryText: string;
    topK?: number;
}

export interface IVectorQueryResult {
    id: string;
    text: string;
    score: number;
}

/**
 * Implements the ISingleMemoryModule interface for the Upstash Vector database,
 * specifically for handling structured entities.
 */
export class EntityVectorMemoryModule implements ISingleMemoryModule {
    private index: Index;

    constructor() {
        if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
            throw new Error("Upstash Vector environment variables (URL and Token) are not set.");
        }
        this.index = new Index({
            url: process.env.UPSTASH_VECTOR_REST_URL,
            token: process.env.UPSTASH_VECTOR_REST_TOKEN,
        });
    }

    async store(params: IVectorMemoryStoreParams): Promise<void> {
        if (!params.text) {
            throw new Error('EntityVectorMemoryModule.store requires text to be provided.');
        }

        const embedding = await llmProvider.generateEmbedding(params.text);
        const vectorId = params.id || uuidv4();

        await this.index.upsert({
            id: vectorId,
            vector: embedding,
            metadata: {
                ...params.metadata,
                text: params.text,
            },
        });
    }

    async query(params: IVectorMemoryQueryParams): Promise<IVectorQueryResult[]> {
        if (!params.queryText) {
            throw new Error('EntityVectorMemoryModule.query requires queryText to be provided.');
        }

        const queryEmbedding = await llmProvider.generateEmbedding(params.queryText);
        const topK = params.topK || 3;

        const results = await this.index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
        });

        return results.map(match => ({
            id: match.id.toString(),
            text: (match.metadata as { text: string })?.text ?? '',
            score: match.score,
        }));
    }
}
