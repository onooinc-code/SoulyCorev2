
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.15',
    version: '0.4.15',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🧠 Cognitive Identity Sync (v0.4.15)

**Core Improvements:**
- **Auto-Identity Sync:** The system now automatically learns your name, role, and preferences in the background without requiring manual "Review".
- **Multilingual Extraction:** Enhanced the memory extraction engine to support Arabic (Egyptian and MSA) identity facts.
- **Context Fix:** Resolved a bug in the Context Assembly Pipeline that caused duplicate messages in the AI's short-term memory.

**Profile Module:**
- Added support for tracking both AI Identity (Souly) and User Identity (Hadra) within the persistent profile.
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
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC
            LIMIT 1;
        `;
        if (rows.length === 0) return NextResponse.json(staticCurrentVersion);
        const dbVersion = rows[0];
        if (compareVersions(dbVersion.version, staticCurrentVersion.version) < 0) {
             return NextResponse.json(staticCurrentVersion);
        }
        return NextResponse.json(dbVersion);
    } catch (error) {
        return NextResponse.json(staticCurrentVersion);
    }
}
