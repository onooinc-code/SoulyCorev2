// core/tools/index.ts
import { webSearch } from './web_search';
import { calculator } from './calculator';
import { executeMcpTool } from './mcp_executor';
import { executeTaskManagementTool } from './task_management';
import { executeProjectManagementTool } from './project_management';


// A registry mapping tool names to their execution functions.
const toolRegistry: Record<string, (args: any) => Promise<string>> = {
    'web_search': webSearch,
    'calculator': calculator,
    'mcp_executor': executeMcpTool,
    'task_management': executeTaskManagementTool,
    'project_management': executeProjectManagementTool,
};

/**
 * Executes a tool by its name with the given arguments.
 * This function acts as a dispatcher to the actual tool implementations.
 * @param toolName The name of the tool to execute, matching a key in the toolRegistry.
 * @param args The arguments to pass to the tool's execution function.
 * @returns A promise that resolves to a string observation of the tool's result.
 */
export async function executeTool(toolName: string, args: any): Promise<string> {
    const toolFunction = toolRegistry[toolName];
    if (toolFunction) {
        try {
            return await toolFunction(args);
        } catch (error) {
            console.error(`Error executing tool '${toolName}':`, error);
            return `Error: ${(error as Error).message}`;
        }
    } else {
        return `Error: Tool '${toolName}' not found.`;
    }
}
