
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🔧 TypeScript Integrity Patch (v0.5.41)

**Fixes:**
- **Signature Mismatch:** Resolved a critical build error in \`MessageList.tsx\` where the \`onViewContext\` prop was being passed without the required \`messageId\` argument.
- **Type Safety:** Aligned \`MessageList\` callbacks with the expected \`Message\` component prop types to ensure Vercel build compatibility.

**Stability:**
- Verified all message-level actions (Summarize, Inspect, View Context) correctly reference the unique message ID within the threaded list.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.41', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "TypeScript signatures fixed. Updated to v0.5.41.", version: '0.5.41' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
