
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.9',
    version: '0.5.9',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🛠️ Strict Auth Sanitization (v0.5.9)

**Security & Reliability:**
- **Aggressive Key Cleaning:** Implemented logic to strip surrounding quotes (\`"\` or \`'\`) from API keys retrieved from environment variables. This handles common configuration errors in Vercel.
- **Prefix Validation:** The system now warns in the server logs if an API Key does not start with \`AIza\`.
- **Diagnostic Transparency:** The Cognitive Diagnostics panel now reports the key prefix (safe subset) to help verify if the key is loaded correctly or corrupted by formatting.

**System Consistency:**
- Applied the new sanitization logic across all entry points: Core Provider, Shared Library, and Model Discovery route.
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
