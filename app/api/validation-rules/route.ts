import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityTypeValidationRules } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<EntityTypeValidationRules>`SELECT * FROM entity_type_validation_rules ORDER BY "entityType" ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch validation rules:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// This endpoint acts as an "upsert"
export async function POST(req: NextRequest) {
    try {
        const { entityType, rulesJson } = await req.json();
        if (!entityType || !rulesJson) {
            return NextResponse.json({ error: 'entityType and rulesJson are required' }, { status: 400 });
        }

        const { rows } = await sql<EntityTypeValidationRules>`
            INSERT INTO entity_type_validation_rules ("entityType", "rulesJson")
            VALUES (${entityType}, ${JSON.stringify(rulesJson)})
            ON CONFLICT ("entityType") DO UPDATE SET 
                "rulesJson" = EXCLUDED."rulesJson",
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to save validation rule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}