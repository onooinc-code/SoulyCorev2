
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticHistory: VersionHistory[] = [
    {
        id: 'v-0.4.16',
        version: '0.4.16',
        releaseDate: new Date(),
        createdAt: new Date(),
        changes: `
### 🕵️ Memory Transparency & Deep Logging (v0.4.16)

**New Cognitive Features:**
- **Extracted Badge:** Every AI message now has a "Extracted" badge in the footer. Click it to see exactly what facts, entities, and preferences were harvested from that turn.
- **Deep-Step Logging:** Added granular logging for every internal pipeline step. You can now see the detailed "Behind the Scenes" of memory extraction in the Debug Log panel.
- **Unified Inspector:** The Cognitive Inspector now displays both "Context Retrieval" (What I read) and "Memory Extraction" (What I learned).

**Bug Fixes:**
- **Pipeline Visibility:** Fixed an issue where background extraction results were hidden from the user.
`
    },
    {
        id: 'v-0.4.15',
        version: '0.4.15',
        releaseDate: new Date('2025-12-22T14:00:00Z'),
        createdAt: new Date(),
        changes: `
### 🧠 Cognitive Identity Sync (v0.4.15)
- Automated background memory extraction for identity sync.
- Enhanced Arabic support for extracting names, roles, and preferences.
- Fixed duplicate messages bug in short-term memory assembly.
`
    },
    {
        id: 'v-0.4.14',
        version: '0.4.14',
        releaseDate: new Date('2025-12-21T12:00:00Z'),
        createdAt: new Date(),
        changes: `
### 📏 Scrolling & UI Integrity (v0.4.14)
- Fixed critical scrolling issue in the message list.
- Improved scrollbar visibility and layout stability.
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
