import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.14',
    version: '0.4.14',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 📏 Scrolling & UI Integrity (v0.4.14)

**UI/UX Fixes:**
- **Scrollbar Restoration:** Fixed a critical CSS layout issue preventing message list scrolling.
- **Flexbox min-h-0:** Applied architectural flex fixes to ensure the chat window respects viewport bounds.
- **Improved Thumbnails:** Enhanced scrollbar visibility in Dark Mode.

**System:**
- **Version Sync:** Hardened versioning system to prevent mismatch between DB and code.
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
        // If DB version is older than code version, use code version
        if (compareVersions(dbVersion.version, staticCurrentVersion.version) < 0) {
             return NextResponse.json(staticCurrentVersion);
        }
        return NextResponse.json(dbVersion);
    } catch (error) {
        return NextResponse.json(staticCurrentVersion);
    }
}