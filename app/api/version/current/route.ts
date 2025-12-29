
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.11',
    version: '0.5.11',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🚀 UX & Traceability Upgrade (v0.5.11)

**Core Experience:**
- **Auto-Navigation:** Creating a new chat now automatically switches focus to it, clearing the previous view immediately.
- **Smart Auto-Titling:** New conversations start as "محادثة جديدة" and automatically generate a descriptive title after the first AI response.

**System Observability:**
- **Deep Trace Links:** System logs in the Dashboard and Log Panel are now clickable, jumping directly to the specific conversation context where the event occurred.
- **Granular Pipeline Logging:** Added specific \`conversationId\` tracking to all memory extraction and context assembly steps.
`
};

function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(p => parseInt(p, 10));
    const parts2 = v2.split('.').map(p => parseInt(p, 10));
    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
        const val1 = parts1[i] || 0;
        const val2 = parts2[i] || 0;
        if (val1 > val2) return 1;
        if (val1 < val2) return -1;
    }
    return 0;
}

export async function GET() {
    try {
        const { rows } = await sql<VersionHistory>`SELECT * FROM version_history ORDER BY "releaseDate" DESC LIMIT 1;`;
        if (rows.length === 0) return NextResponse.json(staticCurrentVersion);
        const dbVersion = rows[0];
        // If DB version is older than static (e.g. fresh deploy before seed), use static
        if (compareVersions(dbVersion.version, staticCurrentVersion.version) < 0) return NextResponse.json(staticCurrentVersion);
        return NextResponse.json(dbVersion);
    } catch (error) { return NextResponse.json(staticCurrentVersion); }
}
