import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { rows } = await sql`
            SELECT 
                er.id,
                s.name as "sourceName",
                p.name as "predicateName",
                t.name as "targetName",
                er."lastVerifiedAt",
                er."verificationStatus"
            FROM entity_relationships er
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            JOIN predicate_definitions p ON er."predicateId" = p.id
            WHERE er."verificationStatus" IS NULL 
               OR er."verificationStatus" = 'Unverified'
               OR er."lastVerifiedAt" < NOW() - INTERVAL '30 days'
            ORDER BY er."lastVerifiedAt" ASC NULLS FIRST
            LIMIT 50;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch verifiable facts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
