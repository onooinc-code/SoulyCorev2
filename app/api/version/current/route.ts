
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.8',
    version: '0.5.8',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🛠️ Key Sanitization & Diagnostics (v0.5.8)

**Core Logic:**
- **Key Trimming:** The Google GenAI client initialization now automatically trims whitespace from API keys (\`API_KEY\` or \`GEMINI_API_KEY\`) to prevent copy-paste errors from breaking authentication.

**Dev Center:**
- **AI Connectivity Check:** Added a live test in the Cognitive Diagnostics panel that pings Google's API. This definitively separates configuration errors from runtime issues.
- **Source Visibility:** The diagnostics panel now indicates which environment variable is currently active (\`API_KEY\` vs \`GEMINI_API_KEY\`).
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
