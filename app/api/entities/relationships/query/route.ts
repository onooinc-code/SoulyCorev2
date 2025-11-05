import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { RelationshipGraphData, GraphNode, GraphEdge, EntityDefinition } from '@/lib/types';
import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for NLQ.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const { rows: entities } = await sql<EntityDefinition>`SELECT name, type FROM entity_definitions`;
        const { rows: predicates } = await sql`SELECT name FROM predicate_definitions`;

        const context = `
            Entities: ${entities.map(e => `${e.name} (type: ${e.type})`).join(', ')}
            Predicates: ${predicates.map(p => p.name).join(', ')}
        `;

        const prompt = `
            You are an AI that translates natural language questions into a structured JSON query for a graph database.
            Based on the available entities and predicates, convert the user's question into a JSON object with 'source', 'predicate', and 'target' keys.
            Each key can have 'name' or 'type' properties. Use '%' as a wildcard for 'name'.
            
            Context:
            ${context}

            User Question: "${query}"

            Example 1: "who works for Google?" -> {"source":{"type":"Person"},"predicate":"works_for","target":{"name":"Google"}}
            Example 2: "what is related to Project Alpha?" -> {"source":{"name":"Project Alpha"},"predicate":"%","target":{"name":"%"}}
            Example 3: "show all companies" -> {"source":{"type":"Company"},"predicate":"%","target":{"name":"%"}}

            Respond with ONLY the JSON object.
        `;

        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const structuredQuery = JSON.parse(response.text.trim());

        // Build SQL query from the structured JSON
        let whereClauses = [];
        const values = [];
        let valueIndex = 1;

        if (structuredQuery.source?.name) { whereClauses.push(`s.name ILIKE $${valueIndex++}`); values.push(structuredQuery.source.name); }
        if (structuredQuery.source?.type) { whereClauses.push(`s.type ILIKE $${valueIndex++}`); values.push(structuredQuery.source.type); }
        if (structuredQuery.predicate) { whereClauses.push(`p.name ILIKE $${valueIndex++}`); values.push(structuredQuery.predicate); }
        if (structuredQuery.target?.name) { whereClauses.push(`t.name ILIKE $${valueIndex++}`); values.push(structuredQuery.target.name); }
        if (structuredQuery.target?.type) { whereClauses.push(`t.type ILIKE $${valueIndex++}`); values.push(structuredQuery.target.type); }

        if (whereClauses.length === 0) {
            return NextResponse.json({ nodes: [], edges: [] });
        }

        const { rows: relationships } = await sql.query(`
            SELECT 
                er.id, er."sourceEntityId", er."targetEntityId", p.name as "predicateName",
                s.id as s_id, s.name as s_name, s.type as s_type,
                t.id as t_id, t.name as t_name, t.type as t_type
            FROM entity_relationships er
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            JOIN predicate_definitions p ON er."predicateId" = p.id
            WHERE ${whereClauses.join(' AND ')}
        `, values);

        const nodesMap = new Map<string, GraphNode>();
        const edges: GraphEdge[] = relationships.map(r => {
            nodesMap.set(r.s_id, { id: r.s_id, name: r.s_name, type: r.s_type });
            nodesMap.set(r.t_id, { id: r.t_id, name: r.t_name, type: r.t_type });
            return {
                id: r.id,
                source: r.sourceEntityId,
                target: r.targetEntityId,
                label: r.predicateName,
            };
        });
        
        const graphData: RelationshipGraphData = { nodes: Array.from(nodesMap.values()), edges };
        return NextResponse.json(graphData);

    } catch (error) {
        console.error('Failed to query relationships:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}