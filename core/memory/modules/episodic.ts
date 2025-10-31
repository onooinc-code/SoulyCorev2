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
     * @returns A promise that resolves with the newly created message object.
     */
    async store(params: IEpisodicMemoryStoreParams): Promise<Message> {
        const { conversationId, message } = params;
        if (!conversationId || !message) {
            throw new Error('EpisodicMemoryModule.store requires conversationId and message data.');
        }

        // Also update the conversation's lastUpdatedAt timestamp
        await sql`UPDATE conversations SET "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = ${conversationId};`;

        const { rows } = await sql<Message>`
            INSERT INTO messages (
                "conversationId", 
                "role", 
                "content", 
                "tokenCount", 
                "responseTime", 
                "isBookmarked", 
                "parentMessageId",
                "tags"
            )
            VALUES (
                ${conversationId}, 
                ${message.role}, 
                ${message.content}, 
                ${message.tokenCount || null}, 
                ${message.responseTime || null}, 
                ${message.isBookmarked || false}, 
                ${message.parentMessageId || null},
                ${message.tags ? (message.tags as any) : null}
            )
            RETURNING *;
        `;
        
        const savedMessage = rows[0];

        // If the message content is large, trigger a background task to summarize it.
        const wordCount = savedMessage.content.split(/\s+/).length;
        if (wordCount > 500) {
            // Fire-and-forget, no need to await this.
            fetch(`/api/messages/${savedMessage.id}/summarize-for-context`, {
                method: 'POST'
            }).catch(err => {
                // Log the error but don't let it affect the main flow.
                console.error(`Failed to trigger background summarization for message ${savedMessage.id}:`, err);
            });
        }

        return savedMessage;
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