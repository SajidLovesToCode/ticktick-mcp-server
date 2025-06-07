/**
 * Tools Integration
 */

import { TickTickClient } from '../api/ticktick-client.js';
import { TaskTools, TaskToolDefinition } from './task-tools.js';
import { ProjectTools, ProjectToolDefinition } from './project-tools.js';

export type ToolDefinition = TaskToolDefinition | ProjectToolDefinition;

export class ToolsManager {
  private taskTools: TaskTools;
  private projectTools: ProjectTools;

  constructor(ticktickClient: TickTickClient) {
    this.taskTools = new TaskTools(ticktickClient);
    this.projectTools = new ProjectTools(ticktickClient);
  }

  getAllToolDefinitions(): ToolDefinition[] {
    return [
      ...this.taskTools.getToolDefinitions(),
      ...this.projectTools.getToolDefinitions(),
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    // Check if it's a task tool
    const taskToolNames = this.taskTools.getToolDefinitions().map(tool => tool.name);
    if (taskToolNames.includes(name)) {
      return this.taskTools.handleToolCall(name, args);
    }

    // Check if it's a project tool
    const projectToolNames = this.projectTools.getToolDefinitions().map(tool => tool.name);
    if (projectToolNames.includes(name)) {
      return this.projectTools.handleToolCall(name, args);
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  getToolsByCategory(): {
    auth: ToolDefinition[];
    tasks: ToolDefinition[];
    projects: ToolDefinition[];
  } {
    return {
      auth: [
        // Auth tools are handled directly in server.ts
      ],
      tasks: this.taskTools.getToolDefinitions(),
      projects: this.projectTools.getToolDefinitions(),
    };
  }
}