
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Tool } from '@/lib/types';

/**
 * Simulates the execution of a tool based on its name and arguments.
 * In a real-world scenario, this would dispatch to actual function execution.
 * @param toolName The name of the tool to execute.
 * @param args The arguments for the tool.
 * @returns A string observation of the tool's result.
 */
function simulateToolExecution(toolName: string, args: any): string {
    console.log(`Simulating execution of tool: ${toolName}`, args);
    switch (toolName) {
        case 'web_search':
            return `Mock search result for query: "${args.query}". Found 3 articles about modern AI frameworks. The most popular ones are React, Vue, and Svelte.`;
        case 'calculator':
            const { operation, a, b } = args;
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (isNaN(numA) || isNaN(numB)) {
                return "Error: Invalid numbers provided.";
            }
            switch (operation) {
                case 'add': return `Result: ${numA + numB}`;
                case 'subtract': return `Result: ${numA - numB}`;
                case 'multiply': return `Result: ${numA * numB}`;
                case 'divide': return b !== 0 ? `Result: ${numA / numB}` : "Error: Cannot divide by zero.";
                default: return `Error: Unknown operation '${operation}'.`;
            }
        default:
            return `Tool '${toolName}' executed successfully with arguments: ${JSON.stringify(args)}`;
    }
}


export async function POST(req: NextRequest) {
    try {
        const { toolId, args } = await req.json();

        if (!toolId || !args) {
            return NextResponse.json({ error: 'Missing toolId or args' }, { status: 400 });
        }

        // Fetch the tool from the database to get its name
        const { rows: toolRows } = await sql<Tool>`
            SELECT name FROM tools WHERE id = ${toolId};
        `;

        if (toolRows.length === 0) {
            return NextResponse.json({ error: `Tool with ID ${toolId} not found.` }, { status: 404 });
        }

        const toolName = toolRows[0].name;
        
        const result = simulateToolExecution(toolName, args);

        return NextResponse.json({ result });

    } catch (error) {
        console.error('Error executing tool:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}