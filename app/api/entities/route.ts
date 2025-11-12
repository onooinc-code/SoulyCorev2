import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityDefinition, EntityTypeValidationRules, ValidationRule } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function validate(entity: Partial<EntityDefinition>): Promise<{ valid: boolean; message: string }> {
    if (!entity.type) return { valid: true, message: '' };

    const { rows } = await sql<EntityTypeValidationRules>`
        SELECT "rulesJson" FROM entity_type_validation_rules WHERE "entityType" = ${entity.type};
    `;
    if (rows.length === 0) return { valid: true, message: '' };

    const rules: ValidationRule[] = rows[0].rulesJson;

    for (const rule of rules) {
        if (rule.rule === 'unique_across_types' && rule.field === 'name') {
            const typesToCheck = [entity.type, ...(rule.params || [])];
            // FIX: Reverted to use ANY() with a type assertion to bypass the build error.
            // The @vercel/postgres runtime handles array parameters correctly with ANY().
            const { rows: existing } = await sql`
                SELECT id FROM entity_definitions WHERE name = ${entity.name} AND type = ANY(${typesToCheck as any}) AND id != ${entity.id || '00000000-0000-0000-0000-000000000000'};
            `;
            if (existing.length > 0) {
                return { valid: false, message: rule.errorMessage || `An entity with name "${entity.name}" already exists in a conflicting type.` };
            }
        }
        // Add more rule checks here...
    }

    return { valid: true, message: '' };
}


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brainId = searchParams.get('brainId');

        let rows;
        if (brainId && brainId !== 'all') {
            const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE "brainId" = ${brainId} ORDER BY "createdAt" DESC;`;
            rows = result.rows;
        } else if (brainId === 'all') {
             const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions ORDER BY "createdAt" DESC;`;
             rows = result.rows;
        } else {
             // Default to no brain
             const result = await sql<EntityDefinition>`SELECT * FROM entity_definitions WHERE "brainId" IS NULL ORDER BY "createdAt" DESC;`;
             rows = result.rows;
        }
        
        return NextResponse.json({ entities: rows });
    } catch (error) {
        console.error('Failed to fetch entities:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const entityData: Partial<EntityDefinition> = await req.json();
        const { name, type, description, aliases, tags, brainId } = entityData;
        if (!name || !type) {
            return NextResponse.json({ error: 'Missing required fields: name and type' }, { status: 400 });
        }

        const validationResult = await validate(entityData);
        if (!validationResult.valid) {
            return NextResponse.json({ error: validationResult.message }, { status: 400 });
        }

        const { rows } = await sql<EntityDefinition>`
            INSERT INTO entity_definitions (name, type, description, aliases, tags, "brainId")
            VALUES (${name}, ${type}, ${description || null}, ${aliases ? JSON.stringify(aliases) : '[]'}, ${tags ? (tags as any) : null}, ${brainId || null})
            ON CONFLICT (name, type, "brainId") DO UPDATE SET 
                description = EXCLUDED.description, 
                aliases = EXCLUDED.aliases,
                tags = EXCLUDED.tags,
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Failed to create entity:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}