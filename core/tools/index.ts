import { executeTaskManagementTool } from './task_management';
import { executeMcpTool } from './mcp_executor';

export async function executeTool(toolName: string, args: any): Promise<string> {
    switch (toolName) {
        case 'task_management':
            return executeTaskManagementTool(args);
        case 'mcp_executor':
            return executeMcpTool(args);
        default:
            return `Error: Tool '${toolName}' not found.`;
    }
}
