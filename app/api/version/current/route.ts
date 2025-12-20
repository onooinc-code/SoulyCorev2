
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.11',
    version: '0.4.11',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🖌️ Visual Refresh & Compact Mode (v0.4.11)

**Toolbar Redesign:**
- **Minimalist Aesthetic:** Removed text labels from both top and bottom toolbars for a cleaner, modern look, relying purely on iconography and tooltips.
- **Optimized Layout:** Buttons are now intelligently distributed to fill the available screen width, ensuring better spacing and touch targets.
- **Increased Input Space:** Leveraged the saved vertical space to expand the main chat input area, making it easier to write and review longer messages (defaulting to 3 rows).

**UX Improvements:**
- **Fluid Responsiveness:** The new toolbar layout adapts better to different screen sizes, providing a consistent experience on desktop and mobile.
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
