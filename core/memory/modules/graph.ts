
/**
 * @fileoverview Implements the Graph Memory Module using Vercel EdgeDB.
 */

import { getEdgeDBClient } from '@/lib/graphdb';
import { ISingleMemoryModule } from '../types';

interface IGraphMemoryStoreParams {
    relationship: {
        subject: string;
        predicate: string;
        object: string;
        brainId?: string | null;
    }
}

interface IGraphMemoryQueryParams {
    entityName: string;
    brainId?: string | null;
}

export class GraphMemoryModule implements ISingleMemoryModule {
    
    async store(params: IGraphMemoryStoreParams): Promise<any> {
        if (!params.relationship) throw new Error('Relationship object required.');
        const { subject, predicate, object, brainId } = params.relationship;
        const client = getEdgeDBClient();

        const query = `
            WITH
              subject_node := (INSERT Node { name := <str>$subject } UNLESS CONFLICT ON .name ELSE (SELECT Node FILTER .name = <str>$subject)),
              object_node := (INSERT Node { name := <str>$object } UNLESS CONFLICT ON .name ELSE (SELECT Node FILTER .name = <str>$object))
            INSERT Relationship {
              subject := subject_node,
              predicate := <str>$predicate,
              object := object_node,
              brain_id := <optional str>$brainId
            };
        `;

        await client.query(query, { subject, predicate, object, brainId: brainId || null });
        return params.relationship;
    }

    async query(params: IGraphMemoryQueryParams): Promise<string[]> {
        if (!params.entityName) return [];
        const client = getEdgeDBClient();
        
        // Brain Isolation: Filter by brain_id if provided, otherwise only global
        const query = `
            SELECT Relationship {
              subject: { name },
              predicate,
              object: { name }
            }
            FILTER (.subject.name = <str>$entityName OR .object.name = <str>$entityName)
            AND (.brain_id = <optional str>$brainId OR (NOT EXISTS .brain_id AND <optional str>$brainId IS EMPTY));
        `;

        const results = await client.queryJSON(query, { 
            entityName: params.entityName, 
            brainId: params.brainId || null 
        });
        const relationships = JSON.parse(results);
        
        return Array.isArray(relationships) ? relationships.map((rel: any) => 
            `${rel.subject.name} ${rel.predicate.replace(/_/g, ' ')} ${rel.object.name}`
        ) : [];
    }
}
