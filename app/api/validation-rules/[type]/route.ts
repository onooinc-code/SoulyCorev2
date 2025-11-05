import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { type: string } }) {
    try {
        const { type } = params;
        const { rowCount } = await sql`DELETE FROM entity_type_validation_rules WHERE "entityType" = ${type};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Validation rule not found for this type' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Validation rule deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete validation rule for type ${params.type}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}