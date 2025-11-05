import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { EntityVectorMemoryModule } from '@/core/memory/modules/entity_vector';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { action, ids, payload } = await req.json();

    if (!action || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'Action and an array of IDs are required.' }, { status: 400 });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        switch (action) {
            case 'delete':
                await client.query(`DELETE FROM entity_definitions WHERE id = ANY($1::uuid[])`, [ids]);
                // Fire-and-forget vector deletion
                const vectorMemory = new EntityVectorMemoryModule();
                vectorMemory.delete(ids).catch(err => console.error(`Failed to bulk delete vectors:`, err));
                break;

            case 'change_type':
                if (!payload || typeof payload.newType !== 'string') {
                    return NextResponse.json({ error: 'Payload with newType is required for change_type action.' }, { status: 400 });
                }
                await client.query(`UPDATE entity_definitions SET type = $1, "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[])`, [payload.newType, ids]);
                break;

            case 'add_tags':
                if (!payload || !Array.isArray(payload.tags) || payload.tags.length === 0) {
                     return NextResponse.json({ error: 'Payload with a non-empty tags array is required for add_tags action.' }, { status: 400 });
                }
                // This query appends new tags, avoiding duplicates.
                await client.query(`
                    UPDATE entity_definitions
                    SET tags = (
                        SELECT array_agg(DISTINCT tag)
                        FROM (
                            SELECT unnest(COALESCE(tags, '{}'::text[])) AS tag
                            UNION ALL
                            SELECT unnest($1::text[]) AS tag
                        ) AS all_tags
                    ), "lastUpdatedAt" = CURRENT_TIMESTAMP
                    WHERE id = ANY($2::uuid[]);
                `, [payload.tags, ids]);
                break;
            
            default:
                await client.query('ROLLBACK');
                return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: `Action '${action}' completed on ${ids.length} entities.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Bulk action '${action}' failed:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}