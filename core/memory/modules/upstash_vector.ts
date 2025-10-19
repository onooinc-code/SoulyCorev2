/**
 * @fileoverview Implements the Semantic/Associative Memory Module using Upstash Vector.
 * This module is responsible for storing and retrieving knowledge and entities based on conceptual similarity.
 */

import { Index } from "@upstash/vector";
import { ISingleMemoryModule } from '../types';
import llmProvider from '@/core/llm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parameters for storing a new piece of data in vector memory.
 */
interface IVectorMemoryStoreParams {
    /** The unique identifier for this memory. If not provided, a new UUID will be generated. */
    id?: string;
    /** The text content of the knowledge/entity to be stored. */
    text: string;
    /** Optional metadata to store alongside the vector. */
    metadata?: Record<string, any>;
}

/**
 * Parameters for querying vector memory.
 */
interface IVectorMemoryQueryParams {
    /** The text to search for. An embedding will be generated from this text. */
    queryText: string;
    /** The number of top results to return. Defaults to 3. */
    topK?: number;
    /** Optional metadata filter to apply to the query. */
    filter?: string;
}

/**
 * The structure of a single result returned from a vector memory query.
 */
export interface IVectorQueryResult {
    id: string;
    text: string;
    score: number;
}

/**
 * Implements the ISingleMemoryModule interface for the Upstash Vector database.
 * This is the unified module for all semantic search operations.
 */
export class UpstashVectorMemoryModule implements ISingleMemoryModule {
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

    /**
     * @inheritdoc
     * Stores a piece of text in the Upstash Vector database.
     * It generates an embedding for the text and upserts it.
     */
    async store(params: IVectorMemoryStoreParams): Promise<void> {
        if (!params.text) {
            throw new Error('UpstashVectorMemoryModule.store requires text to be provided.');
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

    /**
     * @inheritdoc
     * Queries the Upstash Vector database for text conceptually similar to the queryText.
     */
    async query(params: IVectorMemoryQueryParams): Promise<IVectorQueryResult[]> {
        if (!params.queryText) {
            throw new Error('UpstashVectorMemoryModule.query requires queryText to be provided.');
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
