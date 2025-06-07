/**
 * Project-related MCP Tools
 */

import { TickTickClient } from '../api/ticktick-client.js';
import { 
  Project, 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectFilter 
} from '../api/projects/project-types.js';

export interface ProjectToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

export class ProjectTools {
  constructor(private ticktickClient: TickTickClient) {}

  getToolDefinitions(): ProjectToolDefinition[] {
    return [
      {
        name: 'ticktick_list_projects',
        description: 'List all projects with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            kind: {
              type: 'string',
              description: 'Filter by project kind',
              enum: ['PERSONAL', 'SHARED', 'TEAM'],
            },
            closed: {
              type: 'boolean',
              description: 'Filter by closed/archived status',
            },
            search: {
              type: 'string',
              description: 'Search projects by name',
            },
          },
        },
      },
      {
        name: 'ticktick_get_project',
        description: 'Get a specific project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to retrieve',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_create_project',
        description: 'Create a new project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            color: {
              type: 'string',
              description: 'Project color (hex code)',
            },
            viewMode: {
              type: 'string',
              description: 'Project view mode',
              enum: ['list', 'kanban', 'timeline'],
            },
            kind: {
              type: 'string',
              description: 'Project kind',
              enum: ['PERSONAL', 'SHARED', 'TEAM'],
            },
            timeline: {
              type: 'boolean',
              description: 'Enable timeline view',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'ticktick_update_project',
        description: 'Update an existing project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to update',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            color: {
              type: 'string',
              description: 'Project color (hex code)',
            },
            viewMode: {
              type: 'string',
              description: 'Project view mode',
              enum: ['list', 'kanban', 'timeline'],
            },
            timeline: {
              type: 'boolean',
              description: 'Enable timeline view',
            },
            closed: {
              type: 'boolean',
              description: 'Archive/unarchive project',
            },
            muted: {
              type: 'boolean',
              description: 'Mute/unmute project notifications',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_delete_project',
        description: 'Delete a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to delete',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_get_project_tasks',
        description: 'Get all tasks in a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project',
            },
            status: {
              type: 'number',
              description: 'Filter by task status (0=active, 2=completed)',
              enum: [0, 2],
            },
            priority: {
              type: 'number',
              description: 'Filter by priority (0=none, 1=low, 3=medium, 5=high)',
              enum: [0, 1, 3, 5],
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_get_project_stats',
        description: 'Get project statistics (task counts, completion rates, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_archive_project',
        description: 'Archive (close) a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to archive',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'ticktick_unarchive_project',
        description: 'Unarchive (reopen) a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project to unarchive',
            },
          },
          required: ['projectId'],
        },
      },
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'ticktick_list_projects':
        return this.handleListProjects(args);
      case 'ticktick_get_project':
        return this.handleGetProject(args);
      case 'ticktick_create_project':
        return this.handleCreateProject(args);
      case 'ticktick_update_project':
        return this.handleUpdateProject(args);
      case 'ticktick_delete_project':
        return this.handleDeleteProject(args);
      case 'ticktick_get_project_tasks':
        return this.handleGetProjectTasks(args);
      case 'ticktick_get_project_stats':
        return this.handleGetProjectStats(args);
      case 'ticktick_archive_project':
        return this.handleArchiveProject(args);
      case 'ticktick_unarchive_project':
        return this.handleUnarchiveProject(args);
      default:
        throw new Error(`Unknown project tool: ${name}`);
    }
  }

  private async handleListProjects(args: any): Promise<any> {
    const filter: ProjectFilter = {
      kind: args.kind,
      closed: args.closed,
      search: args.search,
    };

    const projects = await this.ticktickClient.projects.getAllProjects(filter);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: projects.length,
            projects: projects.map(project => ({
              id: project.id,
              name: project.name,
              color: project.color,
              kind: project.kind,
              viewMode: project.viewMode,
              closed: project.closed,
              muted: project.muted,
              userCount: project.userCount,
              createdTime: project.createdTime,
              modifiedTime: project.modifiedTime,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetProject(args: any): Promise<any> {
    const project = await this.ticktickClient.projects.getProject(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  }

  private async handleCreateProject(args: any): Promise<any> {
    const projectData: ProjectCreateRequest = {
      name: args.name,
      color: args.color,
      viewMode: args.viewMode,
      kind: args.kind,
      timeline: args.timeline,
    };

    const project = await this.ticktickClient.projects.createProject(projectData);

    return {
      content: [
        {
          type: 'text',
          text: `Project created successfully: ${project.name} (ID: ${project.id})`,
        },
      ],
    };
  }

  private async handleUpdateProject(args: any): Promise<any> {
    const updates: ProjectUpdateRequest = {
      name: args.name,
      color: args.color,
      viewMode: args.viewMode,
      timeline: args.timeline,
      closed: args.closed,
      muted: args.muted,
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof ProjectUpdateRequest] === undefined) {
        delete updates[key as keyof ProjectUpdateRequest];
      }
    });

    const project = await this.ticktickClient.projects.updateProject(args.projectId, updates);

    return {
      content: [
        {
          type: 'text',
          text: `Project updated successfully: ${project.name} (ID: ${project.id})`,
        },
      ],
    };
  }

  private async handleDeleteProject(args: any): Promise<any> {
    await this.ticktickClient.projects.deleteProject(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Project deleted successfully (ID: ${args.projectId})`,
        },
      ],
    };
  }

  private async handleGetProjectTasks(args: any): Promise<any> {
    const tasks = await this.ticktickClient.tasks.getTasksByProject(args.projectId, {
      status: args.status,
      priority: args.priority,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectId: args.projectId,
            count: tasks.length,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              content: task.content,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              createdTime: task.createdTime,
              tags: task.tags,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetProjectStats(args: any): Promise<any> {
    const stats = await this.ticktickClient.projects.getProjectStats(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectId: args.projectId,
            statistics: stats,
            completionRate: stats.totalTasks > 0 ? 
              Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
          }, null, 2),
        },
      ],
    };
  }

  private async handleArchiveProject(args: any): Promise<any> {
    const project = await this.ticktickClient.projects.archiveProject(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Project archived successfully: ${project.name} (ID: ${project.id})`,
        },
      ],
    };
  }

  private async handleUnarchiveProject(args: any): Promise<any> {
    const project = await this.ticktickClient.projects.unarchiveProject(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Project unarchived successfully: ${project.name} (ID: ${project.id})`,
        },
      ],
    };
  }
}