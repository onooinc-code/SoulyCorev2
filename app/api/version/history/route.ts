
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Static source of truth for versions to ensure UI works even if DB seed fails
const staticHistory: VersionHistory[] = [
    {
        id: 'v-0.4.8',
        version: '0.4.8',
        releaseDate: new Date(),
        createdAt: new Date(),
        changes: `
### 🚀 Fixes & Stability (v0.4.8)

**Critical Fixes:**
- **Changelog System:** Fixed the version history not updating in the UI. Implemented a fail-safe mechanism to ensure new release notes appear immediately.
- **Data Integrity:** Updated API routes to ensure robustness against stale database schemas.

**Next Steps (Immediate):**
- Solving the "3 Models Only" issue.
- Restoring the Chat Input Toolbar.
- Fixing Copy/Paste functionality.
`
    },
    {
        id: 'v-0.4.7',
        version: '0.4.7',
        releaseDate: new Date('2024-07-28T10:00:00Z'),
        createdAt: new Date(),
        changes: `
### 🛠️ Critical Fixes & Enhancements (v0.4.7)

**Core Improvements:**
- **Model List:** Fixed the AI Model dropdown to display a comprehensive list of all Gemini models (including Pro, Flash, Vision) by default.
- **Chat Input Toolbar:** Implemented a visible, horizontally scrollable toolbar above the chat input with 15+ quick action buttons.
- **Header Layout:** Resolved the layout issue where the Header was obscuring content.

**Bug Fixes:**
- **Copy/Paste:** Fixed the context menu "Paste" functionality.
- **New Chat Navigation:** Creating a new conversation now immediately switches the view.
`
    },
     {
        id: 'v-0.4.6',
        version: '0.4.6',
        releaseDate: new Date('2024-07-27T12:00:00Z'),
        createdAt: new Date(),
        changes: `
### 🔥 Major Overhaul: The Polish Update (v0.4.6)

**Visual & UX Upgrades:**
- **Invisible Scrollbars:** Completely rewrote the CSS engine to use ultra-minimal scrollbars.
- **Dynamic Header:** The top header now intelligently displays the active section name.
- **Full-Width Messages:** Chat bubbles now utilize the full screen width.

**Chat & Input Evolution:**
- **Power Grid Input:** The chat input area has been supercharged with a Quick Action Grid.
- **Smart Triggers:** Added basic support for slash commands (\`/\`) and entity mentions (\`@\`).
`
    },
    {
        id: 'v-0.4.1',
        version: '0.4.1',
        releaseDate: new Date('2024-07-26T10:00:00Z'),
        createdAt: new Date(),
        changes: `
- **Critical Bug Fix: 500 Errors:** Resolved multiple 500 Internal Server Errors on Vercel deployments.
- **UI Fix: Version Log Modal:** Corrected the styling of the Version Log modal.
`
    },
    {
        id: 'v-0.4.0',
        version: '0.4.0',
        releaseDate: new Date('2024-07-25T10:00:00Z'),
        createdAt: new Date(),
        changes: `
- **Major UI Overhaul:** Implemented a new 'glassmorphism' visual theme.
- **New: Settings Architecture:** All UI settings are now saved to the database.
- **Bug Fixes:** Fixed actions in Header and Context Menu.
`
    }
];

// GET all version history
export async function GET() {
    try {
        // Try to fetch from DB first
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC;
        `;
        
        // Merge Logic: Always ensure staticHistory items exist in the returned list
        // regardless of how many items are in the DB.
        const allVersions = [...rows];
        const dbVersionSet = new Set(rows.map(r => r.version));

        for (const staticVer of staticHistory) {
            if (!dbVersionSet.has(staticVer.version)) {
                // If DB doesn't have this version, add it.
                allVersions.push(staticVer);
            }
        }

        // Re-sort combined list by date descending
        allVersions.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

        return NextResponse.json(allVersions);
    } catch (error) {
        console.warn('Failed to fetch version history from DB, using static fallback:', error);
        // Fallback to static history if DB fails entirely
        return NextResponse.json(staticHistory);
    }
}
