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
    }
}

interface IGraphMemoryQueryParams {
    entityName: string;
}

export class GraphMemoryModule implements ISingleMemoryModule {
    
    /**
     * @inheritdoc
     * Stores a relationship (subject-predicate-object) in the EdgeDB database.
     * It upserts the subject and object nodes and creates a new relationship link between them.
     * @param params - An object containing the relationship to store.
     */
    async store(params: IGraphMemoryStoreParams): Promise<any> {
        if (!params.relationship) {
            throw new Error('GraphMemoryModule.store requires a relationship object.');
        }
        const { subject, predicate, object } = params.relationship;
        const client = getEdgeDBClient();

        const query = `
            WITH
              subject_node := (
                INSERT Node { name := <str>$subject }
                UNLESS CONFLICT ON .name
                ELSE (SELECT Node FILTER .name = <str>$subject)
              ),
              object_node := (
                INSERT Node { name := <str>$object }
                UNLESS CONFLICT ON .name
                ELSE (SELECT Node FILTER .name = <str>$object)
              )
            INSERT Relationship {
              subject := subject_node,
              predicate := <str>$predicate,
              object := object_node
            };
        `;

        await client.query(query, { subject, predicate, object });
        return params.relationship;
    }

    /**
     * @inheritdoc
     * Queries EdgeDB for all relationships connected to a specific entity.
     * @param params - An object containing the entityName to query for.
     * @returns A promise that resolves to an array of relationship strings.
     */
    async query(params: IGraphMemoryQueryParams): Promise<string[]> {
        if (!params.entityName) {
            throw new Error('GraphMemoryModule.query requires an entityName.');
        }
        const client = getEdgeDBClient();
        
        const query = `
            SELECT Relationship {
              subject: { name },
              predicate,
              object: { name }
            }
            FILTER .subject.name = <str>$entityName OR .object.name = <str>$entityName;
        `;

        const results = await client.queryJSON(query, { entityName: params.entityName });
        const relationships = JSON.parse(results);
        
        return relationships.map((rel: any) => 
            `${rel.subject.name} -> ${rel.predicate} -> ${rel.object.name}`
        );
    }
}
