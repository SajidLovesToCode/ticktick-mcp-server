/**
 * Project-related MCP Tools
 */

import { TickTickClient } from '../api/ticktick-client.js';
import { 
  Project, 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectFilter,
  ProjectKind
} from '../api/projects/project-types.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  DeleteProjectSchema,
  ArchiveProjectSchema,
  UnarchiveProjectSchema,
  GetProjectSchema,
  ListProjectsSchema,
  GetProjectTasksSchema,
  GetProjectStatsSchema,
  validate,
  ValidationError,
} from '../validation/index.js';
import { logger } from '../utils/logger.js';

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
              enum: ['TASK', 'NOTE'],
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
              description: 'Project color (hex code, e.g., "#F18181")',
            },
            sortOrder: {
              type: 'number',
              description: 'Project sort order',
            },
            viewMode: {
              type: 'string',
              description: 'Project view mode',
              enum: ['list', 'kanban', 'timeline'],
            },
            kind: {
              type: 'string',
              description: 'Project kind (task or note)',
              enum: ['TASK', 'NOTE'],
              default: 'TASK',
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
            sortOrder: {
              type: 'number',
              description: 'Project sort order',
            },
            viewMode: {
              type: 'string',
              description: 'Project view mode',
              enum: ['list', 'kanban', 'timeline'],
            },
            kind: {
              type: 'string',
              description: 'Project kind',
              enum: ['TASK', 'NOTE'],
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
    try {
      switch (name) {
        case 'ticktick_list_projects':
          return await this.handleListProjects(args);
        case 'ticktick_get_project':
          return await this.handleGetProject(args);
        case 'ticktick_create_project':
          return await this.handleCreateProject(args);
        case 'ticktick_update_project':
          return await this.handleUpdateProject(args);
        case 'ticktick_delete_project':
          return await this.handleDeleteProject(args);
        case 'ticktick_get_project_tasks':
          return await this.handleGetProjectTasks(args);
        case 'ticktick_get_project_stats':
          return await this.handleGetProjectStats(args);
        case 'ticktick_archive_project':
          return await this.handleArchiveProject(args);
        case 'ticktick_unarchive_project':
          return await this.handleUnarchiveProject(args);
        default:
          throw new Error(`Unknown project tool: ${name}`);
      }
    } catch (error: any) {
      // Consistent error response format
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  private async handleListProjects(args: any): Promise<any> {
    // Transform closed to includeArchived for validation
    const validationArgs = {
      includeArchived: args.closed,
      kind: args.kind,
      search: args.search, // search is not in schema but handled separately
    };

    const validated = validate(ListProjectsSchema, validationArgs);

    const filter: ProjectFilter = {
      kind: validated.kind === 'TASK' ? ProjectKind.TASK : validated.kind === 'NOTE' ? ProjectKind.NOTE : undefined,
      closed: validated.includeArchived,
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
    const validated = validate(GetProjectSchema, args);
    const project = await this.ticktickClient.projects.getProject(validated.projectId);

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
    // Map viewMode to viewType for validation
    const validationArgs = {
      ...args,
      viewType: args.viewMode,
    };

    const validated = validate(CreateProjectSchema, validationArgs);

    const projectData: ProjectCreateRequest = {
      name: validated.name,
      color: validated.color,
      sortOrder: validated.sortOrder,
      viewMode: validated.viewType as any, // Map back to viewMode
      kind: validated.kind === 'TASK' ? ProjectKind.TASK : validated.kind === 'NOTE' ? ProjectKind.NOTE : undefined,
    };

    // Remove undefined values
    Object.keys(projectData).forEach(key => {
      if (projectData[key as keyof ProjectCreateRequest] === undefined) {
        delete projectData[key as keyof ProjectCreateRequest];
      }
    });

    const project = await this.ticktickClient.projects.createProject(projectData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project created successfully',
            project: {
              id: project.id,
              name: project.name,
              color: project.color,
              sortOrder: project.sortOrder,
              viewMode: project.viewMode,
              kind: project.kind,
              closed: project.closed,
            }
          }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateProject(args: any): Promise<any> {
    // Map viewMode to viewType for validation
    const validationArgs = {
      ...args,
      viewType: args.viewMode,
    };

    const validated = validate(UpdateProjectSchema, validationArgs);

    const updates: ProjectUpdateRequest = {
      name: validated.name,
      color: validated.color,
      sortOrder: validated.sortOrder,
      viewMode: validated.viewType as any, // Map back to viewMode
      kind: validated.kind === 'TASK' ? ProjectKind.TASK : validated.kind === 'NOTE' ? ProjectKind.NOTE : undefined,
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof ProjectUpdateRequest] === undefined) {
        delete updates[key as keyof ProjectUpdateRequest];
      }
    });

    const project = await this.ticktickClient.projects.updateProject(validated.projectId, updates);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project updated successfully',
            project: {
              id: project.id,
              name: project.name,
              color: project.color,
              viewMode: project.viewMode,
              kind: project.kind,
              sortOrder: project.sortOrder,
            }
          }, null, 2),
        },
      ],
    };
  }

  private async handleDeleteProject(args: any): Promise<any> {
    const validated = validate(DeleteProjectSchema, args);
    await this.ticktickClient.projects.deleteProject(validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project deleted successfully',
            projectId: validated.projectId
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetProjectTasks(args: any): Promise<any> {
    const validated = validate(GetProjectTasksSchema, args);
    
    const tasks = await this.ticktickClient.tasks.getTasksByProject(validated.projectId, {
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
    const validated = validate(GetProjectStatsSchema, args);
    const stats = await this.ticktickClient.projects.getProjectStats(validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectId: validated.projectId,
            statistics: stats,
            completionRate: stats.totalTasks > 0 ? 
              Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
          }, null, 2),
        },
      ],
    };
  }

  private async handleArchiveProject(args: any): Promise<any> {
    const validated = validate(ArchiveProjectSchema, args);
    const project = await this.ticktickClient.projects.archiveProject(validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project archived successfully',
            project: {
              id: project.id,
              name: project.name,
              closed: project.closed
            }
          }, null, 2),
        },
      ],
    };
  }

  private async handleUnarchiveProject(args: any): Promise<any> {
    const validated = validate(UnarchiveProjectSchema, args);
    const project = await this.ticktickClient.projects.unarchiveProject(validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project unarchived successfully',
            project: {
              id: project.id,
              name: project.name,
              closed: project.closed
            }
          }, null, 2),
        },
      ],
    };
  }
}