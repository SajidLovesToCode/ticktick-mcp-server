/**
 * Tasks API Implementation
 */

import { TickTickAPIClient } from '../common/api-client.js';
import { 
  Task, 
  TaskCreateRequest, 
  TaskUpdateRequest, 
  TaskFilter,
  TaskSortOptions,
  ChecklistItem,
  TaskStatus,
  TaskPriority
} from './task-types.js';
import { logger } from '../../utils/logger.js';
import { formatTickTickDate } from '../../utils/date-formatter.js';

export class TasksAPI {
  constructor(private apiClient: TickTickAPIClient) {}

  async getAllTasks(filter?: TaskFilter, sort?: TaskSortOptions): Promise<Task[]> {
    logger.info('Fetching all tasks', { filter, sort });

    // TickTick API only provides tasks through the /project/{id}/data endpoint
    // There's no direct endpoint to list all tasks or apply server-side filters
    if (filter?.projectId) {
      return this.getTasksByProject(filter.projectId, filter, sort);
    }
    
    // If no projectId specified, get tasks from all projects using /project/{id}/data
    const projects = await this.apiClient.get<any[]>('/project');
    const allTasks: Task[] = [];
    
    for (const project of projects) {
      try {
        const projectData = await this.apiClient.get<any>(`/project/${project.id}/data`);
        if (projectData && projectData.tasks && Array.isArray(projectData.tasks)) {
          allTasks.push(...projectData.tasks);
        }
      } catch (error) {
        logger.warn(`Failed to fetch tasks for project ${project.id}:`, error);
      }
    }
    
    return this.applyClientSideFilters(allTasks, filter, sort);
  }

  private applyClientSideFilters(tasks: Task[], filter?: TaskFilter, sort?: TaskSortOptions): Task[] {
    let filteredTasks = tasks;
    
    // Apply basic filters that can be done client-side
    // Note: TickTick API doesn't support server-side filtering except through project data
    if (filter?.status !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }
    
    if (filter?.priority !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }
    
    if (filter?.tags?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filter.tags?.some(filterTag => 
          task.tags?.some(taskTag => taskTag.name === filterTag)
        )
      );
    }
    
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.content?.toLowerCase().includes(searchLower)
      );
    }
    
    // Date-based filtering (client-side only)
    if (filter?.startDate) {
      const startDate = new Date(filter.startDate);
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) >= startDate
      );
    }
    
    if (filter?.endDate) {
      const endDate = new Date(filter.endDate);
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) <= endDate
      );
    }
    
    if (filter?.hasReminder !== undefined) {
      filteredTasks = filteredTasks.filter(task => 
        filter.hasReminder ? (task.reminders && task.reminders.length > 0) : !task.reminders?.length
      );
    }
    
    if (filter?.hasAttachment !== undefined) {
      filteredTasks = filteredTasks.filter(task => 
        filter.hasAttachment ? (task.attachments && task.attachments.length > 0) : !task.attachments?.length
      );
    }
    
    if (filter?.isOverdue) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => 
        task.status !== TaskStatus.COMPLETED && 
        task.dueDate && 
        new Date(task.dueDate) < now
      );
    }
    
    if (filter?.completedAfter) {
      const completedAfter = new Date(filter.completedAfter);
      filteredTasks = filteredTasks.filter(task => 
        task.completedTime && new Date(task.completedTime) >= completedAfter
      );
    }
    
    if (filter?.completedBefore) {
      const completedBefore = new Date(filter.completedBefore);
      filteredTasks = filteredTasks.filter(task => 
        task.completedTime && new Date(task.completedTime) <= completedBefore
      );
    }
    
    // Note: modifiedAfter/modifiedBefore filters removed as they're not supported by API

    // Apply sorting
    if (sort) {
      filteredTasks.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sort.field) {
          case 'title':
            aValue = a.title || '';
            bValue = b.title || '';
            break;
          case 'dueDate':
            aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            break;
          case 'priority':
            aValue = a.priority || 0;
            bValue = b.priority || 0;
            break;
          case 'createdTime':
            aValue = a.createdTime ? new Date(a.createdTime).getTime() : 0;
            bValue = b.createdTime ? new Date(b.createdTime).getTime() : 0;
            break;
          case 'modifiedTime':
            aValue = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
            bValue = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }
        
        if (sort.direction === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    logger.info(`Retrieved ${filteredTasks.length} tasks`);
    return filteredTasks;
  }

  async getTask(taskId: string, projectId?: string): Promise<Task> {
    logger.info(`Fetching task: ${taskId}`);
    
    // Use the official TickTick API endpoint to get a specific task
    if (projectId) {
      const task = await this.apiClient.get<Task>(`/project/${projectId}/task/${taskId}`);
      logger.info(`Retrieved task: ${task.title}`);
      return task;
    }
    
    // If no projectId provided, search all projects for the task
    const projects = await this.apiClient.get<any[]>('/project');
    
    for (const project of projects) {
      try {
        const task = await this.apiClient.get<Task>(`/project/${project.id}/task/${taskId}`);
        if (task) {
          logger.info(`Retrieved task: ${task.title}`);
          return task;
        }
      } catch (error) {
        // Task not found in this project, continue searching
        logger.debug(`Task ${taskId} not found in project ${project.id}`);
      }
    }
    
    throw new Error(`Task ${taskId} not found`);
  }

  async getTasksByProject(projectId: string, filter?: Omit<TaskFilter, 'projectId'>, sort?: TaskSortOptions): Promise<Task[]> {
    logger.info(`Fetching tasks for project: ${projectId}`);
    
    const projectData = await this.apiClient.get<any>(`/project/${projectId}/data`);
    const tasks = projectData?.tasks || [];
    
    return this.applyClientSideFilters(tasks, filter, sort);
  }

  async createTask(taskData: TaskCreateRequest): Promise<Task> {
    logger.info('Creating new task', taskData);

    // Format date fields to TickTick API format
    const formattedTaskData = {
      ...taskData,
      startDate: formatTickTickDate(taskData.startDate),
      dueDate: formatTickTickDate(taskData.dueDate),
    };

    const task = await this.apiClient.post<Task>('/task', formattedTaskData);
    
    logger.info(`Created task: ${task.title} (${task.id})`);
    return task;
  }

  async updateTask(taskId: string, updates: TaskUpdateRequest): Promise<Task> {
    logger.info(`Updating task: ${taskId}`, updates);

    // projectId is required by TickTick API specification for task updates
    const projectId = updates.projectId;
    if (!projectId) {
      throw new Error(`ProjectId is required for task updates according to TickTick API specification`);
    }

    // Format date fields to TickTick API format and remove undefined values
    const formattedUpdates: any = {};
    
    // Only include defined values in the update request
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof TaskUpdateRequest];
      if (value !== undefined) {
        if (key === 'startDate' || key === 'dueDate' || key === 'completedTime') {
          const formattedDate = formatTickTickDate(value as string);
          if (formattedDate) {
            formattedUpdates[key] = formattedDate;
          }
        } else if (key === 'items' && Array.isArray(value)) {
          formattedUpdates[key] = value.map(item => {
            const formattedItem: any = {};
            Object.keys(item).forEach(itemKey => {
              const itemValue = item[itemKey as keyof typeof item];
              if (itemValue !== undefined) {
                if (itemKey === 'startDate' || itemKey === 'completedTime') {
                  const formattedDate = formatTickTickDate(itemValue as string);
                  if (formattedDate) {
                    formattedItem[itemKey] = formattedDate;
                  }
                } else {
                  formattedItem[itemKey] = itemValue;
                }
              }
            });
            return formattedItem;
          });
        } else {
          formattedUpdates[key] = value;
        }
      }
    });

    // Use the correct TickTick API endpoint to update a task
    // POST /open/v1/task/{taskId} with task data including ID and projectId in body
    const requestBody = {
      id: taskId,
      projectId,
      ...formattedUpdates
    };
    
    logger.info(`Task update request body:`, requestBody);
    
    try {
      const task = await this.apiClient.post<Task>(`/task/${taskId}`, requestBody);
      
      logger.info(`Updated task: ${task.title}`);
      return task;
    } catch (error: any) {
      logger.error(`Task update API call failed:`, {
        taskId,
        requestBody,
        error: error.message,
        status: error.status,
        data: error.data
      });
      throw error;
    }
  }

  async deleteTask(taskId: string, projectId: string): Promise<void> {
    logger.info(`Deleting task: ${taskId} from project: ${projectId}`);
    
    // Use the correct TickTick API endpoint for deleting tasks
    await this.apiClient.delete(`/project/${projectId}/task/${taskId}`);
    
    logger.info(`Deleted task: ${taskId}`);
  }

  async completeTask(taskId: string, projectId: string): Promise<void> {
    logger.info(`Completing task: ${taskId} in project: ${projectId}`);
    
    // Use the correct TickTick API endpoint for completing tasks
    await this.apiClient.post(`/project/${projectId}/task/${taskId}/complete`, {});
    
    logger.info(`Completed task: ${taskId}`);
  }

  async uncompleteTask(taskId: string, projectId: string): Promise<Task> {
    logger.info(`Uncompleting task: ${taskId}`, { projectId });
    
    // To uncomplete a task, we need to update it with status 0
    return this.updateTask(taskId, {
      projectId,
      status: TaskStatus.ACTIVE,
      completedTime: undefined
    });
  }

  async moveTask(taskId: string, sourceProjectId: string, targetProjectId: string): Promise<Task> {
    logger.info(`Moving task ${taskId} from project ${sourceProjectId} to project ${targetProjectId}`);
    
    // Move task by updating its projectId
    return this.updateTask(taskId, {
      projectId: targetProjectId
    });
  }

  async addChecklistItem(taskId: string, projectId: string, item: Omit<ChecklistItem, 'id' | 'completedTime'>): Promise<Task> {
    logger.info(`Adding checklist item to task: ${taskId}`, item);
    
    // Get the current task to retrieve existing items
    const task = await this.getTask(taskId, projectId);
    const items = task.items || [];
    
    const newItem: ChecklistItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      status: TaskStatus.ACTIVE,
      startDate: formatTickTickDate(item.startDate),
    };
    
    items.push(newItem);
    
    return this.updateTask(taskId, { projectId, items });
  }

  async updateChecklistItem(taskId: string, projectId: string, itemId: string, updates: Partial<ChecklistItem>): Promise<Task> {
    logger.info(`Updating checklist item ${itemId} in task: ${taskId}`, updates);
    
    // Get the current task to retrieve existing items
    const task = await this.getTask(taskId, projectId);
    const items = task.items || [];
    
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Checklist item ${itemId} not found in task ${taskId}`);
    }
    
    const formattedUpdates = {
      ...updates,
      startDate: formatTickTickDate(updates.startDate),
      completedTime: formatTickTickDate(updates.completedTime),
    };
    
    items[itemIndex] = { ...items[itemIndex], ...formattedUpdates };
    
    return this.updateTask(taskId, { projectId, items });
  }

  async removeChecklistItem(taskId: string, projectId: string, itemId: string): Promise<Task> {
    logger.info(`Removing checklist item ${itemId} from task: ${taskId}`);
    
    // Get the current task to retrieve existing items
    const task = await this.getTask(taskId, projectId);
    const items = (task.items || []).filter(item => item.id !== itemId);
    
    return this.updateTask(taskId, { projectId, items });
  }

  async searchTasks(query: string, filter?: Omit<TaskFilter, 'search'>): Promise<Task[]> {
    logger.info(`Searching tasks with query: "${query}"`);
    
    return this.getAllTasks({ ...filter, search: query });
  }

  async getOverdueTasks(projectId?: string): Promise<Task[]> {
    logger.info('Fetching overdue tasks', { projectId });
    
    return this.getAllTasks({ 
      projectId, 
      isOverdue: true,
      status: TaskStatus.ACTIVE
    });
  }

  async getTasksWithPriority(priority: TaskPriority, projectId?: string): Promise<Task[]> {
    logger.info(`Fetching tasks with priority: ${priority}`, { projectId });
    
    return this.getAllTasks({ projectId, priority });
  }

  async getCompletedTasks(projectId?: string, since?: string): Promise<Task[]> {
    logger.info('Fetching completed tasks', { projectId, since });
    
    return this.getAllTasks({ 
      projectId, 
      status: TaskStatus.COMPLETED,
      completedAfter: since
    });
  }
}