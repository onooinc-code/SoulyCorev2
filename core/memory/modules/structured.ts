/**
 * @fileoverview Implements the Structured Memory Module for managing entities and contacts.
 */

import { sql } from '@/lib/db';
import { ISingleMemoryModule } from '../types';
import type { Entity, Contact } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// --- Type definitions for method parameters ---

type StructuredDataType = 'entity' | 'contact';

// Using a discriminated union to correctly model that 'data' will be either a Partial<Entity>
// or a Partial<Contact>, resolving potential type conflicts.
type IStructuredMemoryStoreParams =
    | { type: 'entity'; data: Partial<Entity> }
    | { type: 'contact'; data: Partial<Contact> };

interface IStructuredMemoryQueryParams {
    type: StructuredDataType;
    id?: string;
    name?: string;
}

/**
 * Implements the ISingleMemoryModule interface for structured data (entities, contacts)
 * stored in Vercel Postgres.
 */
export class StructuredMemoryModule implements ISingleMemoryModule {
    /**
     * @inheritdoc
     * Stores or updates a structured data record (an entity or a contact).
     * @param params - An object containing the type of data and the data itself.
     */
    async store(params: IStructuredMemoryStoreParams): Promise<void> {
        switch (params.type) {
            case 'entity': {
                const { data } = params;
                if (!data.name || !data.type) {
                    throw new Error('StructuredMemoryModule.store (entity) requires name and type.');
                }
                await sql`
                    INSERT INTO entities (id, name, type, details_json)
                    VALUES (${data.id || uuidv4()}, ${data.name}, ${data.type as string}, ${data.details_json || '{}'})
                    ON CONFLICT (name, type) DO UPDATE SET details_json = EXCLUDED.details_json, "createdAt" = CURRENT_TIMESTAMP;
                `;
                break;
            }
            case 'contact': {
                const { data } = params;
                 if (!data.name) {
                    throw new Error('StructuredMemoryModule.store (contact) requires a name.');
                }
                await sql`
                    INSERT INTO contacts (id, name, email, company, phone, notes, tags)
                    VALUES (${data.id || uuidv4()}, ${data.name}, ${data.email || null}, ${data.company || null}, ${data.phone || null}, ${data.notes || null}, ${data.tags ? (data.tags as any) : null})
                    ON CONFLICT (name, email) DO UPDATE SET
                        company = EXCLUDED.company,
                        phone = EXCLUDED.phone,
                        notes = EXCLUDED.notes,
                        tags = EXCLUDED.tags;
                `;
                break;
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
    async query(params: IStructuredMemoryQueryParams): Promise<(Entity | Contact)[]> {
        const { type, id, name } = params;

        switch (type) {
            case 'entity':
                if (id) {
                    const { rows } = await sql<Entity>`SELECT * FROM entities WHERE id = ${id};`;
                    return rows;
                }
                // Default to all entities if no specific filter
                const { rows: allEntityRows } = await sql<Entity>`SELECT * FROM entities ORDER BY "createdAt" DESC;`;
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
    async delete(type: StructuredDataType, id: string): Promise<void> {
         if (!type || !id) {
            throw new Error('StructuredMemoryModule.delete requires a type and an id.');
        }

        if (type === 'entity') {
            await sql`DELETE FROM entities WHERE id = ${id};`;
        } else if (type === 'contact') {
            await sql`DELETE FROM contacts WHERE id = ${id};`;
        } else {
            throw new Error(`Unsupported data type for structured memory delete: ${type}`);
        }
    }
}