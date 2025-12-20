
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.10',
    version: '0.4.10',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🛠️ Customization & Productivity (v0.4.10)

**New Features:**
- **Customizable Prompt Buttons:** You can now **Right-Click** on any button in the top toolbar (Summarize, Enhance, etc.) to edit its label and prompt template.
- **Persistent Settings:** Changes to toolbar buttons are saved to your global settings and persist across sessions.

**Enhancements:**
- **Toolbar UI:** Improved the edit modal for a seamless experience directly within the chat input area.
`
};

// Helper for semantic version comparison
// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
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

// GET the latest version
export async function GET() {
    try {
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC
            LIMIT 1;
        `;
        
        if (rows.length === 0) {
             return NextResponse.json(staticCurrentVersion);
        }

        const dbVersion = rows[0];
        
        // Use semantic comparison instead of string comparison
        // to handle cases like 0.4.10 > 0.4.9 correctly.
        if (compareVersions(dbVersion.version, staticCurrentVersion.version) < 0) {
             return NextResponse.json(staticCurrentVersion);
        }

        return NextResponse.json(dbVersion);
    } catch (error) {
        console.warn('Failed to fetch current version from DB, using static fallback:', error);
        return NextResponse.json(staticCurrentVersion);
    }
}
