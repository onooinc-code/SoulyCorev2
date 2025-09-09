/**
 * @fileoverview Implements the Working Memory Module using Vercel KV (Redis).
 * This module is designed for high-speed, temporary storage of in-flight data.
 */

import { kv } from '@vercel/kv';
import { ISingleMemoryModule } from '../types';

/**
 * Represents the parameters for storing data in working memory.
 */
interface IWorkingMemoryStoreParams {
    sessionId: string;
    data: any;
    // Time-to-live in seconds.
    ttl?: number;
}

/**
 * Represents the parameters for querying data from working memory.
 */
interface IWorkingMemoryQueryParams {
    sessionId: string;
}

/**
 * Implements the ISingleMemoryModule interface for Vercel KV.
 * Used for short-term, ephemeral storage, such as the assembled context for a single API call.
 */
export class WorkingMemoryModule implements ISingleMemoryModule {
    private readonly DEFAULT_TTL_SECONDS = 300; // 5 minutes

    /**
     * @inheritdoc
     * Stores data in Vercel KV with a specific session ID as the key.
     * @param params - An object containing sessionId, data, and an optional ttl.
     * @returns A promise that resolves when the data has been stored.
     */
    async store(params: IWorkingMemoryStoreParams): Promise<void> {
        if (!params.sessionId || params.data === undefined) {
            throw new Error('WorkingMemoryModule.store requires sessionId and data.');
        }

        const key = `session:${params.sessionId}`;
        const ttl = params.ttl || this.DEFAULT_TTL_SECONDS;

        await kv.set(key, params.data, { ex: ttl });
    }

    /**
     * @inheritdoc
     * Queries Vercel KV for data associated with a specific session ID.
     * @param params - An object containing the sessionId to query.
     * @returns A promise that resolves with the retrieved data, or null if not found.
     */
    async query(params: IWorkingMemoryQueryParams): Promise<any> {
        if (!params.sessionId) {
            throw new Error('WorkingMemoryModule.query requires a sessionId.');
        }

        const key = `session:${params.sessionId}`;
        const data = await kv.get(key);
        return data;
    }

    /**
     * Deletes data from working memory for a given session ID.
     * @param sessionId - The session ID to delete.
     * @returns A promise that resolves when the data has been deleted.
     */
    async delete(sessionId: string): Promise<void> {
         if (!sessionId) {
            throw new Error('WorkingMemoryModule.delete requires a sessionId.');
        }
        const key = `session:${sessionId}`;
        await kv.del(key);
    }
}