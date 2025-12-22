
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.18',
    version: '0.4.18',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🚦 Multimodal Cognitive Monitoring (v0.4.18)

**New Real-time Monitoring:**
- **Tiered Memory Buttons:** Added dedicated monitors for Semantic, Structured, Graph, and Episodic memory in the Status Bar.
- **Dynamic State Visualization:** Buttons now pulse Yellow during retrieval, Green on success, and Red on error.
- **Deep Inspection Modals:** Click any memory button to see the raw data retrieved for the last conversation turn.
- **Auto-Reset Logic:** Monitoring states now automatically reset when you send a new message.

**Architectural Improvements:**
- **Metadata Feedback Loop:** Enhanced Context Assembly Pipeline and Chat API to return retrieval metadata for frontend transparency.
- **Monitor Sync:** Fixed tool status persistence across different conversation turns.
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
