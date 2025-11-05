/**
 * @fileoverview Implements the Structured Memory Module for managing entities, relationships, and contacts.
 */

import { sql } from '@/lib/db';
import { ISingleMemoryModule } from '../types';
// FIX: Corrected import path for types.
import type { EntityDefinition, EntityRelationship, Contact } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// --- Type definitions for method parameters ---

type StructuredDataType = 'entity' | 'contact' | 'relationship';

type IStructuredMemoryStoreParams =
    | { type: 'entity'; data: Partial<EntityDefinition> }
    | { type: 'contact'; data: Partial<Contact> }
    | { type: 'relationship'; data: Partial<EntityRelationship> };

interface IStructuredMemoryQueryParams {
    type: 'entity' | 'contact';
    id?: string;
    name?: string;
}

/**
 * Implements the ISingleMemoryModule interface for structured data (entities, contacts, relationships)
 * stored in Vercel Postgres.
 */
export class StructuredMemoryModule implements ISingleMemoryModule {
    /**
     * @inheritdoc
     * Stores or updates a structured data record.
     * @param params - An object containing the type of data and the data itself.
     * @returns A promise that resolves with the created or updated record.
     */
    async store(params: IStructuredMemoryStoreParams): Promise<any> {
        switch (params.type) {
            case 'entity': {
                const { data } = params;
                if (!data.name || !data.type) {
                    throw new Error('StructuredMemoryModule.store (entity) requires name and type.');
                }
                const { rows } = await sql<EntityDefinition>`
                    INSERT INTO entity_definitions (id, name, type, description, aliases, "lastUpdatedAt")
                    VALUES (${data.id || uuidv4()}, ${data.name as string}, ${data.type as string}, ${data.description || null}, ${data.aliases ? JSON.stringify(data.aliases) : '[]'}, CURRENT_TIMESTAMP)
                    ON CONFLICT (name, type) DO UPDATE SET 
                        description = EXCLUDED.description,
                        aliases = EXCLUDED.aliases,
                        "lastUpdatedAt" = CURRENT_TIMESTAMP
                    RETURNING *;
                `;
                return rows[0] || null;
            }
            case 'contact': {
                const { data } = params;
                 if (!data.name) {
                    throw new Error('StructuredMemoryModule.store (contact) requires a name.');
                }
                const { rows } = await sql<Contact>`
                    INSERT INTO contacts (id, name, email, company, phone, notes, tags, "lastUpdatedAt")
                    VALUES (${data.id || uuidv4()}, ${data.name as string}, ${data.email || null}, ${data.company || null}, ${data.phone || null}, ${data.notes || null}, ${data.tags ? (data.tags as any) : null}, CURRENT_TIMESTAMP)
                    ON CONFLICT (name, email) DO UPDATE SET
                        company = EXCLUDED.company,
                        phone = EXCLUDED.phone,
                        notes = EXCLUDED.notes,
                        tags = EXCLUDED.tags,
                        "lastUpdatedAt" = CURRENT_TIMESTAMP
                    RETURNING *;
                `;
                return rows[0] || null;
            }
             case 'relationship': {
                const { data } = params;
                // FIX: Property 'predicate' does not exist on type 'Partial<EntityRelationship>'. Corrected to 'predicateId'.
                if (!data.sourceEntityId || !data.targetEntityId || !data.predicateId) {
                    throw new Error('StructuredMemoryModule.store (relationship) requires source, target, and predicateId.');
                }
                const { rows } = await sql<EntityRelationship>`
                    INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", "predicateId", "context")
                    // FIX: Property 'predicate' does not exist on type 'Partial<EntityRelationship>'. Corrected to 'predicateId'.
                    VALUES (${data.sourceEntityId}, ${data.targetEntityId}, ${data.predicateId}, ${data.context || null})
                    RETURNING *;
                `;
                return rows[0] || null;
            }
            default:
                throw new Error(`Unsupported data type for structured memory.`);
        }
    }

    /**
     * @inheritdoc
     * Queries for structured data records.
     * @param params - An object containing the type and query filters (e.g., id, name).
     * @returns A promise that resolves with an array of matching records.
     */
    async query(params: IStructuredMemoryQueryParams): Promise<(EntityDefinition | Contact)[]> {
        const { type, id, name } = params;

        switch (type) {
            case 'entity':
                if (id) {
                    const { rows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE id = ${id};`;
                    return rows;
                }
                // Default to all entities if no specific filter
                const { rows: allEntityRows } = await sql<EntityDefinition>`SELECT * FROM entity_definitions ORDER BY "createdAt" DESC;`;
                return allEntityRows;

            case 'contact':
                if (id) {
                    const { rows } = await sql<Contact>`SELECT * FROM contacts WHERE id = ${id};`;
                    return rows;
                }
                if (name) {
                    const { rows } = await sql<Contact>`SELECT * FROM contacts WHERE name ILIKE ${'%' + name + '%'};`;
                    return rows;
                }
                // Default to all contacts if no specific filter
                const { rows: allContactRows } = await sql<Contact>`SELECT * FROM contacts ORDER BY name ASC;`;
                return allContactRows;
            
             default:
                throw new Error(`Unsupported data type for structured memory query: ${type}`);
        }
    }

    /**
     * Deletes a specific structured data record by its ID.
     * @param type - The type of record to delete ('entity' or 'contact').
     * @param id - The UUID of the record to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    async delete(type: 'entity' | 'contact', id: string): Promise<void> {
         if (!type || !id) {
            throw new Error('StructuredMemoryModule.delete requires a type and an id.');
        }

        if (type === 'entity') {
            await sql`DELETE FROM entity_definitions WHERE id = ${id};`;
        } else if (type === 'contact') {
            await sql`DELETE FROM contacts WHERE id = ${id};`;
        } else {
            throw new Error(`Unsupported data type for structured memory delete: ${type}`);
        }
    }
}
