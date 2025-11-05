import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found for fact verification.");
    return new GoogleGenAI({ apiKey });
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { relationshipId } = await req.json();

    if (!relationshipId) {
        return NextResponse.json({ error: 'relationshipId is required' }, { status: 400 });
    }

    try {
        // 1. Fetch relationship details
        const { rows: relRows } = await sql`
            SELECT 
                s.name as "sourceName",
                p.name as "predicateName",
                t.name as "targetName"
            FROM entity_relationships er
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            JOIN predicate_definitions p ON er."predicateId" = p.id
            WHERE er.id = ${relationshipId};
        `;
        if (relRows.length === 0) {
            return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
        }
        const { sourceName, predicateName, targetName } = relRows[0];

        // 2. Construct question for AI
        const question = `Is it true that ${sourceName} ${predicateName.replace(/_/g, ' ')} ${targetName}? Please use Google Search to find the most current information. Answer with only "Yes", "No", or "Uncertain".`;

        // 3. Call Gemini with Search Grounding
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: question }] }],
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const answer = response.text?.trim().toLowerCase() || 'uncertain';
        let verificationStatus = 'Unverified';
        if (answer.startsWith('yes')) {
            verificationStatus = 'Verified';
        } else if (answer.startsWith('no')) {
            verificationStatus = 'Refuted';
        }

        // 4. Update database
        const { rows: updatedRows } = await sql`
            UPDATE entity_relationships
            SET "verificationStatus" = ${verificationStatus}, "lastVerifiedAt" = CURRENT_TIMESTAMP
            WHERE id = ${relationshipId}
            RETURNING "verificationStatus", "lastVerifiedAt";
        `;

        return NextResponse.json(updatedRows[0]);

    } catch (error) {
        console.error('Failed to verify fact:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
