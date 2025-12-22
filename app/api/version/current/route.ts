
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.5.0',
    version: '0.5.0',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: `
### 🤖 Autonomous Cognition & ReAct (v0.5.0)

**True ReAct Agent Logic:**
- **Dynamic Reasoning:** Added a ReAct toggle to enable autonomous tool selection and execution loops.
- **Agent Monitor:** Live tracking of tool inputs and AI observations.

**Cognitive Synthesis:**
- **Nexus Summarizer:** New synthesis engine that links long-term semantic facts with current turn context.
- **Reporting:** Automatic generation of "state-of-knowledge" reports.

**AI Usage Metrics:**
- **Call Counter:** Real-time tracking of AI model calls per session.
- **Usage Tooltip:** Detailed log of which subsystem (Retrieval, Synthesis, etc) is accessing the AI.

**Bug Fixes:**
- **Build Integrity:** Resolved type mapping error in ToolInspectorModal.
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
