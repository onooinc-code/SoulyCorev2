
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.16',
    version: '0.4.16',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🕵️ Memory Transparency & Deep Logging (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** Every AI message now has a "Extracted" badge in the footer. Click it to see exactly what facts, entities, and preferences were harvested from that turn.
- **Deep-Step Logging:** Added granular logging for every internal pipeline step. You can now see the detailed "Behind the Scenes" of memory extraction in the Debug Log panel.
- **Unified Inspector:** The Cognitive Inspector now displays both "Context Retrieval" (What I read) and "Memory Extraction" (What I learned).

**Bug Fixes:**
- **Pipeline Visibility:** Fixed an issue where background extraction results were hidden from the user.
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
        if (compareVersions(dbVersion.version, staticCurrentVersion.version) < 0) return NextResponse.json(staticCurrentVersion);
        return NextResponse.json(dbVersion);
    } catch (error) { return NextResponse.json(staticCurrentVersion); }
}
