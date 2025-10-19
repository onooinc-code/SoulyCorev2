/**
 * @fileoverview Implements the Semantic Memory Module using Pinecone.
 * This module is responsible for storing and retrieving knowledge based on conceptual similarity.
 */

import { ISingleMemoryModule } from '../types';
import llmProvider from '@/core/llm';
import { knowledgeBaseIndex } from '@/lib/pinecone';
import { v4 as uuidv4 } from 'uuid';
import type { ScoredPineconeRecord } from '@pinecone-database/pinecone';

/**
 * Parameters for storing a new piece of knowledge in semantic memory.
 */
interface ISemanticMemoryStoreParams {
    /** The unique identifier for this memory. If not provided, a new UUID will be generated. */
    id?: string;
    /** The text content of the knowledge to be stored. */
    text: string;
    /** Optional metadata to store alongside the vector. */
    metadata?: Record<string, any>;
}

/**
 * Parameters for querying semantic memory.
 */
interface ISemanticMemoryQueryParams {
    /** The text to search for. An embedding will be generated from this text. */
    queryText: string;
    /** The number of top results to return. Defaults to 3. */
    topK?: number;
    /** Optional metadata filter to apply to the query. */
    filter?: Record<string, any>;
}

/**
 * The structure of a single result returned from a semantic memory query.
 */
export interface ISemanticQueryResult {
    id: string;
    text: string;
    score: number;
}

/**
 * Implements the ISingleMemoryModule interface for the Pinecone vector database.
 * Handles the storage and retrieval of unstructured knowledge chunks.
 */
export class SemanticMemoryModule implements ISingleMemoryModule {
    /**
     * @inheritdoc
     * Stores a piece of text in the Pinecone vector database.
     * It generates an embedding for the text and upserts it.
     * @param params - An object containing the text and optional metadata to store.
     * @returns A promise that resolves when the data has been stored.
     */
    async store(params: ISemanticMemoryStoreParams): Promise<void> {
        if (!params.text) {
            throw new Error('SemanticMemoryModule.store requires text to be provided.');
        }

        const embedding = await llmProvider.generateEmbedding(params.text);
        const vectorId = params.id || uuidv4();

        const vectorToUpsert = {
            id: vectorId,
            values: embedding,
            metadata: {
                ...params.metadata,
                text: params.text,
            },
        };

        await knowledgeBaseIndex.upsert([vectorToUpsert]);
    }

    /**
     * @inheritdoc
     * Queries the Pinecone vector database for text conceptually similar to the queryText.
     * @param params - An object containing the queryText and an optional topK value.
     * @returns A promise that resolves to an array of the most relevant knowledge chunks.
     */
    async query(params: ISemanticMemoryQueryParams): Promise<ISemanticQueryResult[]> {
        if (!params.queryText) {
            throw new Error('SemanticMemoryModule.query requires queryText to be provided.');
        }

        const queryEmbedding = await llmProvider.generateEmbedding(params.queryText);
        const topK = params.topK || 3;

        const queryResponse = await knowledgeBaseIndex.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
            filter: params.filter,
        });

        const results: ISemanticQueryResult[] = queryResponse.matches.map((match: ScoredPineconeRecord) => {
             const metadata = match.metadata as { text: string } | undefined;
             return {
                id: match.id,
                text: metadata?.text ?? '',
                score: match.score ?? 0,
            };
        });

        return results;
    }
}
