/**
 * @fileoverview Implements the Episodic Memory Module for conversation history.
 */

import { sql } from '@/lib/db';
import { ISingleMemoryModule } from '../types';
import type { Message } from '@/lib/types';

interface IEpisodicMemoryStoreParams {
    conversationId: string;
    message: Omit<Message, 'id' | 'createdAt' | 'conversationId'>;
}

interface IEpisodicMemoryQueryParams {
    conversationId: string;
    limit?: number;
}

/**
 * Implements the ISingleMemoryModule interface for managing conversation history
 * (messages) in the Vercel Postgres database.
 */
export class EpisodicMemoryModule implements ISingleMemoryModule {
    /**
     * @inheritdoc
     * Stores a new message in the database for a given conversation.
     * @param params - An object containing the conversationId and the message data.
     * @returns A promise that resolves when the operation is complete.
     */
    // FIX: Changed return type from `Promise<Message>` to `Promise<void>` to match ISingleMemoryModule interface.
    async store(params: IEpisodicMemoryStoreParams): Promise<void> {
        const { conversationId, message } = params;
        if (!conversationId || !message) {
            throw new Error('EpisodicMemoryModule.store requires conversationId and message data.');
        }

        // Also update the conversation's lastUpdatedAt timestamp
        await sql`UPDATE conversations SET "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = ${conversationId};`;

        await sql`
            INSERT INTO messages ("conversationId", role, content, "tokenCount", "responseTime", "isBookmarked")
            VALUES (${conversationId}, ${message.role}, ${message.content}, ${message.tokenCount}, ${message.responseTime}, ${message.isBookmarked});
        `;
    }

    /**
     * @inheritdoc
     * Queries the database for messages belonging to a specific conversation.
     * @param params - An object containing the conversationId and an optional limit.
     * @returns A promise that resolves with an array of messages.
     */
    async query(params: IEpisodicMemoryQueryParams): Promise<Message[]> {
        const { conversationId, limit = 50 } = params;
        if (!conversationId) {
            throw new Error('EpisodicMemoryModule.query requires a conversationId.');
        }
        
        const { rows } = await sql<Message>`
            SELECT * FROM messages 
            WHERE "conversationId" = ${conversationId} 
            ORDER BY "createdAt" DESC
            LIMIT ${limit};
        `;
        // Return in ascending order for processing
        return rows.reverse();
    }
}