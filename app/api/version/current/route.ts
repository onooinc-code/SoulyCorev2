
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.19',
    version: '0.4.19',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🕵️ Full Cognitive Transparency (v0.4.19)

**Memory Monitor Upgrades:**
- **Null Result State:** Added an Amber status color to indicate successful queries that returned no matches, distinguishing them from errors.
- **Input Query Tracking:** The Memory Inspector now displays the exact query sent to each memory tier for full auditability.

**Static Memory Integration:**
- **Identity Button:** Added a dedicated "Identity" button to the Status Bar to access static user data.
- **Profile Modal:** New centralized view for User Preferences, Digital Identity, and Harvested Personal Facts.
- **Static vs dynamic Toggle:** Clearer visual separation between turn-based memory and long-term user profile facts.
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
