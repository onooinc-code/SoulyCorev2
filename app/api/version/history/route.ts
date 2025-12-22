
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticHistory: VersionHistory[] = [
    {
        id: 'v-0.4.13',
        version: '0.4.13',
        releaseDate: new Date(),
        createdAt: new Date(),
        changes: `
### 🛠️ Persistence & Build Integrity (v0.4.13)

**Architecture Fixes:**
- **Zero Data Loss:** Modified database initialization to use \`IF NOT EXISTS\` without dropping tables. Your data now persists across deployments.
- **Vercel Build Stability:** Fixed critical TypeScript type errors in processing pipelines that were causing deployment failures.

**UI Restorations:**
- **Debug Log Access:** Added a dedicated "Logs" toggle button in the chat status bar for instant access to the developer console.
`
    },
    {
        id: 'v-0.4.12',
        version: '0.4.12',
        releaseDate: new Date('2024-07-30T10:00:00Z'),
        createdAt: new Date(),
        changes: `
### 📐 Symmetric Interface Update (v0.4.12)
- **Symmetric Toolbars:** Both toolbars now have exactly 12 buttons each.
`
    }
];

export async function GET() {
    try {
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC;
        `;
        const allVersions = [...rows];
        const dbVersionSet = new Set(rows.map(r => r.version));
        for (const staticVer of staticHistory) {
            if (!dbVersionSet.has(staticVer.version)) {
                allVersions.push(staticVer);
            }
        }
        allVersions.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        return NextResponse.json(allVersions);
    } catch (error) {
        console.warn('Failed to fetch version history from DB, using static fallback:', error);
        return NextResponse.json(staticHistory);
    }
}
