/**
 * @fileoverview Implements the Entity Vector Memory Module using Upstash Vector.
 * This module is responsible for storing and retrieving entities based on conceptual similarity.
 */

import { Index } from "@upstash/vector";
import { ISingleMemoryModule } from '../types';
import llmProvider from '@/core/llm';

interface IVectorMemoryStoreParams {
    id: string; // Postgres UUID, required to link
    text: string;
    metadata?: Record<string, any>;
}

interface IVectorMemoryQueryParams {
    queryText: string;
    topK?: number;
}

export interface IVectorQueryResult {
    id: string; // This will be the entity's UUID from Postgres
    text: string;
    score: number;
}

/**
 * Implements the ISingleMemoryModule interface for the Upstash Vector database,
 * specifically for handling structured entities.
 */
export class EntityVectorMemoryModule implements ISingleMemoryModule {
    private index: Index | null = null;
    private isInitialized = false;

    private getClient(): Index | null {
        if (this.isInitialized) {
            return this.index;
        }
        this.isInitialized = true;
        
        if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
            console.warn("Upstash Vector environment variables not set. Entity vector memory will be disabled.");
            this.index = null;
            return null;
        }
        
        try {
            this.index = new Index({
                url: process.env.UPSTASH_VECTOR_REST_URL,
                token: process.env.UPSTASH_VECTOR_REST_TOKEN,
            });
            return this.index;
        } catch (error) {
            console.error("Failed to initialize Upstash Vector client:", error);
            this.index = null;
            return null;
        }
    }

    constructor() {
        // The client is now lazily initialized in getClient() to prevent Vercel build errors.
    }

    async store(params: IVectorMemoryStoreParams): Promise<void> {
        const client = this.getClient();
        if (!client) {
            return; // Gracefully do nothing if not configured
        }

        if (!params.text || !params.id) {
            throw new Error('EntityVectorMemoryModule.store requires text and a linking id to be provided.');
        }

        const embedding = await llmProvider.generateEmbedding(params.text);

        await client.upsert({
            id: params.id, // Use the postgres UUID as the vector ID
            vector: embedding,
            metadata: {
                ...params.metadata,
                text: params.text,
            },
        });
    }

    async query(params: IVectorMemoryQueryParams): Promise<IVectorQueryResult[]> {
        const client = this.getClient();
        if (!client) {
            return []; // Gracefully return empty array if not configured
        }

        if (!params.queryText) {
            return [];
        }
        
        const queryEmbedding = await llmProvider.generateEmbedding(params.queryText);
        const topK = params.topK || 3;

        const results = await client.query({
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

    /**
     * Deletes one or more vectors from the index by their IDs.
     * @param ids - A single ID or an array of IDs to delete.
     */
    async delete(ids: string | string[]): Promise<void> {
        const client = this.getClient();
        if (!client) {
            return; // Gracefully do nothing
        }
        await client.delete(ids);
    }
}