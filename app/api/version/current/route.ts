
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.10',
    version: '0.5.10',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🛠️ Robust Auth Strategy (v0.5.10)

**Critical Fixes:**
- **Smart Key Selection:** The system now intelligently iterates through all available environment variables (\`API_KEY\`, \`GEMINI_API_KEY\`) and prioritizes the one that matches the Google API Key format (starts with \`AIza\`). This resolves issues where an empty or invalid primary key would block the valid backup key.
- **Enhanced Sanitization:** Hardened logic to strip surrounding quotes and trim whitespace across all authentication entry points.

**Diagnostics:**
- **Key Source Visibility:** The diagnostics panel now correctly reports which specific environment variable (and its validity status) is currently active.
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
