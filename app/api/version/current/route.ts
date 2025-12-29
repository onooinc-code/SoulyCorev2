
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.12',
    version: '0.5.12',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🛠️ Stability & Live Sync Patch (v0.5.12)

**Critical Bug Fixes:**
- **Extraction Pipeline Auth:** Fixed a critical 'API_KEY_INVALID' error in the background memory extraction process. The pipeline now uses the same robust key sanitization logic (stripping quotes, whitespace) as the main chat server.
- **Chat UI Sync:** Fixed an issue where new messages and AI responses wouldn't appear immediately. Implemented stricter state management to ensure the UI updates instantly upon receiving data, regardless of DB latency.

**System Observability:**
- **Live Log Polling:** The System Output panel now auto-refreshes every 2 seconds to capture background events (like memory extraction) in real-time without requiring a page reload.
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
