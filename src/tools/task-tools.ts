/**
 * Task-related MCP Tools
 */

import { TickTickClient } from '../api/ticktick-client.js';
import { 
  Task, 
  TaskCreateRequest, 
  TaskUpdateRequest, 
  TaskFilter,
  TaskSortOptions,
  TaskPriority
} from '../api/tasks/task-types.js';
import { formatTickTickDate } from '../utils/date-formatter.js';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CompleteTaskSchema,
  DeleteTaskSchema,
  ListTasksFilterSchema,
  GetTaskSchema,
  SearchTasksSchema,
  validate,
  createHelpfulError,
  ValidationError,
} from '../validation/index.js';
import { logger } from '../utils/logger.js';

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
            projectId: {
              type: 'string',
              description: 'The project ID containing the task (optional, will search all projects if not provided)',
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
              description: 'Due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
            },
            startDate: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
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
              description: 'Reminder time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
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
            projectId: {
              type: 'string',
              description: 'The project ID containing the task (required by TickTick API)',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            content: {
              type: 'string',
              description: 'Task description/content',
            },
            desc: {
              type: 'string',
              description: 'Task description',
            },
            isAllDay: {
              type: 'boolean',
              description: 'Whether the task is an all-day task',
            },
            startDate: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
            },
            timeZone: {
              type: 'string',
              description: 'Time zone for the task',
            },
            reminders: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of reminder triggers (e.g., ["TRIGGER:P0DT9H0M0S"])',
            },
            repeatFlag: {
              type: 'string',
              description: 'Repeat rule (e.g., "RRULE:FREQ=DAILY;INTERVAL=1")',
            },
            priority: {
              type: 'number',
              description: 'Task priority (0=none, 1=low, 3=medium, 5=high)',
              enum: [0, 1, 3, 5],
            },
            status: {
              type: 'number',
              description: 'Task status (0=active, 2=completed, -1=deleted)',
              enum: [0, 2, -1],
            },
            completedTime: {
              type: 'string',
              description: 'Completion time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.',
            },
            sortOrder: {
              type: 'number',
              description: 'Sort order for the task',
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
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'number' },
                  sortOrder: { type: 'number' },
                  startDate: { 
                    type: 'string',
                    description: 'Start date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.'
                  },
                  isAllDay: { type: 'boolean' },
                  timeZone: { type: 'string' },
                  completedTime: { 
                    type: 'string',
                    description: 'Completion time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or simple date format (YYYY-MM-DD). Will be automatically converted to TickTick API format.'
                  },
                },
                required: ['title', 'status', 'sortOrder'],
              },
              description: 'Checklist items',
            },
          },
          required: ['taskId', 'projectId'],
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
            projectId: {
              type: 'string',
              description: 'The project ID containing the task',
            },
          },
          required: ['taskId', 'projectId'],
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
            projectId: {
              type: 'string',
              description: 'The project ID containing the task',
            },
          },
          required: ['taskId', 'projectId'],
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
            projectId: {
              type: 'string',
              description: 'The project ID containing the task',
            },
          },
          required: ['taskId', 'projectId'],
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
    try {
      switch (name) {
        case 'ticktick_list_tasks':
          return await this.handleListTasks(args);
        case 'ticktick_get_task':
          return await this.handleGetTask(args);
        case 'ticktick_create_task':
          return await this.handleCreateTask(args);
        case 'ticktick_update_task':
          return await this.handleUpdateTask(args);
        case 'ticktick_delete_task':
          return await this.handleDeleteTask(args);
        case 'ticktick_complete_task':
          return await this.handleCompleteTask(args);
        case 'ticktick_uncomplete_task':
          return await this.handleUncompleteTask(args);
        case 'ticktick_search_tasks':
          return await this.handleSearchTasks(args);
        case 'ticktick_get_overdue_tasks':
          return await this.handleGetOverdueTasks(args);
        default:
          throw new Error(`Unknown task tool: ${name}`);
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

  private async handleListTasks(args: any): Promise<any> {
    // Transform numeric values to strings for validation
    const validationArgs = {
      ...args,
      status: args.status !== undefined ? String(args.status) : undefined,
      priority: args.priority !== undefined ? String(args.priority) : undefined,
    };

    const validated = validate(ListTasksFilterSchema, validationArgs);

    const filter: TaskFilter = {
      projectId: validated.projectId,
      status: validated.status !== undefined ? Number(validated.status) : undefined,
      priority: validated.priority !== undefined ? Number(validated.priority) : undefined,
      search: validated.search,
      isOverdue: args.isOverdue,
      hasReminder: args.hasReminder,
    };

    const sort: TaskSortOptions | undefined = validated.sortBy ? {
      field: validated.sortBy,
      direction: validated.sortOrder || 'asc',
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
    const validated = validate(GetTaskSchema, args);
    const task = await this.ticktickClient.tasks.getTask(validated.taskId, validated.projectId);

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
    // Transform priority to string for validation
    const validationArgs = {
      ...args,
      priority: args.priority !== undefined ? String(args.priority) : undefined,
    };

    const validated = validate(CreateTaskSchema, validationArgs);

    const taskData: TaskCreateRequest = {
      projectId: validated.projectId,
      title: validated.title,
      content: validated.content || validated.desc,
      dueDate: validated.dueDate ? formatTickTickDate(validated.dueDate) : undefined,
      startDate: validated.startDate ? formatTickTickDate(validated.startDate) : undefined,
      priority: validated.priority ? Number(validated.priority) : TaskPriority.NONE,
      tags: validated.tags?.map(tag => ({ name: tag })),
      reminders: args.reminder ? [formatTickTickDate(args.reminder)].filter(Boolean) as string[] : undefined,
      isAllDay: validated.allDay,
      timeZone: validated.timeZone,
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
    // Transform values for validation
    const validationArgs = {
      ...args,
      priority: args.priority !== undefined ? String(args.priority) : undefined,
      status: args.status !== undefined ? String(args.status) : undefined,
    };

    const validated = validate(UpdateTaskSchema, validationArgs);

    // Check if we have any updates to apply
    const hasUpdates = Object.keys(validated).some(key => 
      key !== 'taskId' && key !== 'projectId' && validated[key as keyof typeof validated] !== undefined
    );
    
    if (!hasUpdates) {
      throw new ValidationError('At least one field to update must be provided (title, content, dueDate, etc.)');
    }

    // Format items array if provided
    const formattedItems = validated.items?.map((item: any) => ({
      ...item,
      status: item.status ? String(item.status) : '0',
    }));

    const updates: TaskUpdateRequest = {
      title: validated.title,
      content: validated.content || validated.desc,
      desc: validated.desc,
      isAllDay: args.isAllDay,
      startDate: validated.startDate ? formatTickTickDate(validated.startDate) : undefined,
      dueDate: validated.dueDate ? formatTickTickDate(validated.dueDate) : undefined,
      timeZone: validated.timeZone,
      reminders: validated.reminders?.map(r => r.trigger),
      repeatFlag: validated.repeatFlag || validated.repeatFrom,
      priority: validated.priority !== undefined ? Number(validated.priority) : undefined,
      status: validated.status !== undefined ? Number(validated.status) : undefined,
      completedTime: args.completedTime ? formatTickTickDate(args.completedTime) : undefined,
      sortOrder: validated.sortOrder,
      tags: validated.tags?.map(tag => ({ name: tag })),
      projectId: validated.projectId,
      items: formattedItems,
    };

      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof TaskUpdateRequest] === undefined) {
          delete updates[key as keyof TaskUpdateRequest];
        }
      });

    const updatedTask = await this.ticktickClient.tasks.updateTask(validated.taskId, updates);

    return {
      content: [
        {
          type: 'text',
          text: `Task updated successfully: ${updatedTask.title} (ID: ${updatedTask.id})`,
        },
      ],
    };
  }

  private async handleDeleteTask(args: any): Promise<any> {
    const validated = validate(DeleteTaskSchema, args);
    await this.ticktickClient.tasks.deleteTask(validated.taskId, validated.projectId);

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
    const validated = validate(CompleteTaskSchema, args);
    await this.ticktickClient.tasks.completeTask(validated.taskId, validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Task completed successfully (ID: ${args.taskId})`,
        },
      ],
    };
  }

  private async handleUncompleteTask(args: any): Promise<any> {
    const validated = validate(CompleteTaskSchema, args); // Use same schema as complete
    const uncompletedTask = await this.ticktickClient.tasks.uncompleteTask(validated.taskId, validated.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Task marked as incomplete successfully: ${uncompletedTask.title} (ID: ${uncompletedTask.id})`,
        },
      ],
    };
  }

  private async handleSearchTasks(args: any): Promise<any> {
    const validated = validate(SearchTasksSchema, args);
    const tasks = await this.ticktickClient.tasks.searchTasks(validated.query, {
      projectId: validated.projectId,
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
    // Simple validation for optional projectId
    const projectId = args.projectId;
    if (projectId && typeof projectId !== 'string') {
      throw new ValidationError('projectId must be a string');
    }
    
    const tasks = await this.ticktickClient.tasks.getOverdueTasks(projectId);

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