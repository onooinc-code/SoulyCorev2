import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticHistory: VersionHistory[] = [
    {
        id: 'v-0.4.14',
        version: '0.4.14',
        releaseDate: new Date(),
        createdAt: new Date(),
        changes: `
### 📏 Scrolling & UI Integrity (v0.4.14)
- Fixed critical scrolling issue in the message list.
- Improved scrollbar visibility and layout stability.
`
    },
    {
        id: 'v-0.4.13',
        version: '0.4.13',
        releaseDate: new Date('2024-07-31T12:00:00Z'),
        createdAt: new Date(),
        changes: `
### 🛠️ Persistence & Build Integrity (v0.4.13)
- Modified DB initialization to prevent data loss.
- Fixed Vercel build errors.
- Added Debug Log toggle in StatusBar.
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
        return NextResponse.json(staticHistory);
    }
}