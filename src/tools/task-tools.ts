/**
 * Task-related MCP Tools
 */

import { TickTickClient } from '../api/ticktick-client.js';
import { 
  Task, 
  TaskCreateRequest, 
  TaskUpdateRequest, 
  TaskFilter,
  TaskSortOptions 
} from '../api/tasks/task-types.js';
import { Priority } from '../api/common/types.js';

export interface TaskToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

export class TaskTools {
  constructor(private ticktickClient: TickTickClient) {}

  getToolDefinitions(): TaskToolDefinition[] {
    return [
      {
        name: 'ticktick_list_tasks',
        description: 'List all tasks with optional filtering and sorting',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter tasks by project ID',
            },
            status: {
              type: 'number',
              description: 'Filter by task status (0=active, 2=completed, -1=deleted)',
              enum: [0, 2, -1],
            },
            priority: {
              type: 'number',
              description: 'Filter by priority (0=none, 1=low, 3=medium, 5=high)',
              enum: [0, 1, 3, 5],
            },
            search: {
              type: 'string',
              description: 'Search tasks by title or content',
            },
            isOverdue: {
              type: 'boolean',
              description: 'Filter for overdue tasks only',
            },
            hasReminder: {
              type: 'boolean',
              description: 'Filter tasks with reminders',
            },
            sortBy: {
              type: 'string',
              description: 'Sort field',
              enum: ['dueDate', 'priority', 'title', 'createdTime', 'modifiedTime'],
            },
            sortOrder: {
              type: 'string',
              description: 'Sort direction',
              enum: ['asc', 'desc'],
            },
          },
        },
      },
      {
        name: 'ticktick_get_task',
        description: 'Get a specific task by ID',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task to retrieve',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ticktick_create_task',
        description: 'Create a new task',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID where the task will be created',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            content: {
              type: 'string',
              description: 'Task description/content',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
            },
            priority: {
              type: 'number',
              description: 'Task priority (0=none, 1=low, 3=medium, 5=high)',
              enum: [0, 1, 3, 5],
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                },
                required: ['name'],
              },
              description: 'Task tags',
            },
            reminder: {
              type: 'string',
              description: 'Reminder time in ISO format',
            },
          },
          required: ['projectId', 'title'],
        },
      },
      {
        name: 'ticktick_update_task',
        description: 'Update an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task to update',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            content: {
              type: 'string',
              description: 'Task description/content',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in ISO format',
            },
            priority: {
              type: 'number',
              description: 'Task priority (0=none, 1=low, 3=medium, 5=high)',
              enum: [0, 1, 3, 5],
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                },
                required: ['name'],
              },
              description: 'Task tags',
            },
            projectId: {
              type: 'string',
              description: 'Move task to different project',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ticktick_delete_task',
        description: 'Delete a task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task to delete',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ticktick_complete_task',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task to complete',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ticktick_uncomplete_task',
        description: 'Mark a task as not completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task to uncomplete',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'ticktick_search_tasks',
        description: 'Search tasks by query string',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for task title and content',
            },
            projectId: {
              type: 'string',
              description: 'Limit search to specific project',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'ticktick_get_overdue_tasks',
        description: 'Get all overdue tasks',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Filter by project ID',
            },
          },
        },
      },
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'ticktick_list_tasks':
        return this.handleListTasks(args);
      case 'ticktick_get_task':
        return this.handleGetTask(args);
      case 'ticktick_create_task':
        return this.handleCreateTask(args);
      case 'ticktick_update_task':
        return this.handleUpdateTask(args);
      case 'ticktick_delete_task':
        return this.handleDeleteTask(args);
      case 'ticktick_complete_task':
        return this.handleCompleteTask(args);
      case 'ticktick_uncomplete_task':
        return this.handleUncompleteTask(args);
      case 'ticktick_search_tasks':
        return this.handleSearchTasks(args);
      case 'ticktick_get_overdue_tasks':
        return this.handleGetOverdueTasks(args);
      default:
        throw new Error(`Unknown task tool: ${name}`);
    }
  }

  private async handleListTasks(args: any): Promise<any> {
    const filter: TaskFilter = {
      projectId: args.projectId,
      status: args.status,
      priority: args.priority,
      search: args.search,
      isOverdue: args.isOverdue,
      hasReminder: args.hasReminder,
    };

    const sort: TaskSortOptions | undefined = args.sortBy ? {
      field: args.sortBy,
      direction: args.sortOrder || 'asc',
    } : undefined;

    const tasks = await this.ticktickClient.tasks.getAllTasks(filter, sort);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: tasks.length,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              content: task.content,
              projectId: task.projectId,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              createdTime: task.createdTime,
              modifiedTime: task.modifiedTime,
              tags: task.tags,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetTask(args: any): Promise<any> {
    const task = await this.ticktickClient.tasks.getTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }

  private async handleCreateTask(args: any): Promise<any> {
    const taskData: TaskCreateRequest = {
      projectId: args.projectId,
      title: args.title,
      content: args.content,
      dueDate: args.dueDate,
      priority: args.priority || Priority.NONE,
      tags: args.tags,
      reminder: args.reminder,
    };

    const task = await this.ticktickClient.tasks.createTask(taskData);

    return {
      content: [
        {
          type: 'text',
          text: `Task created successfully: ${task.title} (ID: ${task.id})`,
        },
      ],
    };
  }

  private async handleUpdateTask(args: any): Promise<any> {
    const updates: TaskUpdateRequest = {
      title: args.title,
      content: args.content,
      dueDate: args.dueDate,
      priority: args.priority,
      tags: args.tags,
      projectId: args.projectId,
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof TaskUpdateRequest] === undefined) {
        delete updates[key as keyof TaskUpdateRequest];
      }
    });

    const task = await this.ticktickClient.tasks.updateTask(args.taskId, updates);

    return {
      content: [
        {
          type: 'text',
          text: `Task updated successfully: ${task.title} (ID: ${task.id})`,
        },
      ],
    };
  }

  private async handleDeleteTask(args: any): Promise<any> {
    await this.ticktickClient.tasks.deleteTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: `Task deleted successfully (ID: ${args.taskId})`,
        },
      ],
    };
  }

  private async handleCompleteTask(args: any): Promise<any> {
    const task = await this.ticktickClient.tasks.completeTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: `Task completed: ${task.title} (ID: ${task.id})`,
        },
      ],
    };
  }

  private async handleUncompleteTask(args: any): Promise<any> {
    const task = await this.ticktickClient.tasks.uncompleteTask(args.taskId);

    return {
      content: [
        {
          type: 'text',
          text: `Task marked as incomplete: ${task.title} (ID: ${task.id})`,
        },
      ],
    };
  }

  private async handleSearchTasks(args: any): Promise<any> {
    const tasks = await this.ticktickClient.tasks.searchTasks(args.query, {
      projectId: args.projectId,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            count: tasks.length,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              content: task.content,
              projectId: task.projectId,
              priority: task.priority,
              dueDate: task.dueDate,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetOverdueTasks(args: any): Promise<any> {
    const tasks = await this.ticktickClient.tasks.getOverdueTasks(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: tasks.length,
            overdueTasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              projectId: task.projectId,
              priority: task.priority,
            })),
          }, null, 2),
        },
      ],
    };
  }
}