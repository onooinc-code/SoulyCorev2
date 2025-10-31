

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { ApiEndpoint } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<ApiEndpoint>`SELECT * FROM api_endpoints ORDER BY "groupName", path ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch API endpoints:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const endpoint = await req.json() as Omit<ApiEndpoint, 'id' | 'createdAt' | 'last_test_at' | 'last_test_status'>;
        // FIX: Corrected snake_case property names to camelCase to match type definition.
        const { method, path, groupName, description, defaultParamsJson, defaultBodyJson, expectedStatusCode } = endpoint;

        if (!method || !path || !groupName) {
            return NextResponse.json({ error: 'Method, path, and groupName are required' }, { status: 400 });
        }

        const { rows } = await sql<ApiEndpoint>`
            INSERT INTO api_endpoints (method, path, "groupName", description, "defaultParamsJson", "defaultBodyJson", "expectedStatusCode")
            VALUES (
                ${method}, 
                ${path}, 
                ${groupName}, 
                ${description}, 
                ${defaultParamsJson ? JSON.stringify(defaultParamsJson) : null}, 
                ${defaultBodyJson ? JSON.stringify(defaultBodyJson) : null}, 
                ${expectedStatusCode || 200}
            )
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create API endpoint:', error);
        if ((error as any).code === '23505') { // unique_violation
             return NextResponse.json({ error: 'An endpoint with this path already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}