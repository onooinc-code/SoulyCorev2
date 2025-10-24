import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';
import type { Project, ProjectTask } from '@/lib/types';

const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("API key not found.");
    return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;

        const { rows: projectRows } = await sql<Project>`SELECT * FROM projects WHERE id = ${projectId}`;
        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const project = projectRows[0];

        const { rows: taskRows } = await sql<ProjectTask>`SELECT * FROM project_tasks WHERE project_id = ${projectId}`;
        
        const prompt = `
            Analyze the following project data and provide a concise, professional summary of its status.
            The summary should be formatted in Markdown.

            Project Name: ${project.name}
            Description: ${project.description}
            Status: ${project.status}
            Due Date: ${project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}

            Tasks:
            ${taskRows.length > 0 ? taskRows.map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.title}`).join('\n') : 'No tasks defined.'}

            Provide a one-paragraph executive summary of the project's current state, highlighting progress and any potential blockers based on the tasks.
        `;
        
        const ai = getAiClient();
        const result = await ai.models.generateContent({
            // @google/genai-api-guideline-fix: Use 'gemini-2.5-flash' for this summarization task.
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        // @google/genai-api-guideline-fix: Per @google/genai guidelines, access the text property directly from the response object.
        if (!result.text) {
            throw new Error("AI failed to generate a project summary.");
        }
        return NextResponse.json({ summary: result.text });

    } catch (error) {
        console.error(`Error summarizing project ${params.projectId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}