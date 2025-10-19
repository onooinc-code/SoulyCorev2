// core/tools/project_management.ts
import { sql } from '@/lib/db';

/**
 * A tool for interacting with the project management system (projects and tasks).
 * This is a mock implementation. A real implementation would have more robust logic.
 */
export async function executeProjectManagementTool(args: {
    action: 'add_project' | 'add_task';
    project_name?: string;
    project_id?: string;
    task_title?: string;
}): Promise<string> {
    const { action, project_name, project_id, task_title } = args;

    try {
        switch (action) {
            case 'add_project':
                if (!project_name) return "Error: 'project_name' is required to add a project.";
                await sql`INSERT INTO projects (name, status) VALUES (${project_name}, 'Not Started')`;
                return `Project '${project_name}' was successfully created.`;
            
            case 'add_task':
                if (!project_id || !task_title) return "Error: 'project_id' and 'task_title' are required to add a task.";
                await sql`INSERT INTO project_tasks (project_id, title, status) VALUES (${project_id}, ${task_title}, 'todo')`;
                return `Task '${task_title}' was successfully added to project ID ${project_id}.`;
            
            default:
                return `Error: Unknown project management action '${action}'.`;
        }
    } catch (error) {
        console.error("Error in project management tool:", error);
        return `Error executing project management tool: ${(error as Error).message}`;
    }
}
