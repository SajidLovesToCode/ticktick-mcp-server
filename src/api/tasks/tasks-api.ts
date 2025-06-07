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
  TaskStatus
} from './task-types.js';
import { Priority } from '../common/types.js';
import { logger } from '../../utils/logger.js';

export class TasksAPI {
  constructor(private apiClient: TickTickAPIClient) {}

  async getAllTasks(filter?: TaskFilter, sort?: TaskSortOptions): Promise<Task[]> {
    logger.info('Fetching all tasks', { filter, sort });

    const params: Record<string, any> = {};
    
    if (filter?.projectId) params.projectId = filter.projectId;
    if (filter?.status !== undefined) params.status = filter.status;
    if (filter?.priority !== undefined) params.priority = filter.priority;
    if (filter?.assignee) params.assignee = filter.assignee;
    if (filter?.tags?.length) params.tags = filter.tags.join(',');
    if (filter?.startDate) params.startDate = filter.startDate;
    if (filter?.endDate) params.endDate = filter.endDate;
    if (filter?.search) params.search = filter.search;
    if (filter?.completedAfter) params.completedAfter = filter.completedAfter;
    if (filter?.completedBefore) params.completedBefore = filter.completedBefore;
    if (filter?.modifiedAfter) params.modifiedAfter = filter.modifiedAfter;
    if (filter?.modifiedBefore) params.modifiedBefore = filter.modifiedBefore;

    if (sort) {
      params.sortBy = sort.field;
      params.sortOrder = sort.direction;
    }

    const tasks = await this.apiClient.get<Task[]>('/task', params);
    
    // Apply client-side filters that aren't supported by API
    let filteredTasks = tasks;
    
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

    logger.info(`Retrieved ${filteredTasks.length} tasks`);
    return filteredTasks;
  }

  async getTask(taskId: string): Promise<Task> {
    logger.info(`Fetching task: ${taskId}`);
    
    const task = await this.apiClient.get<Task>(`/task/${taskId}`);
    
    logger.info(`Retrieved task: ${task.title}`);
    return task;
  }

  async getTasksByProject(projectId: string, filter?: Omit<TaskFilter, 'projectId'>): Promise<Task[]> {
    logger.info(`Fetching tasks for project: ${projectId}`);
    
    return this.getAllTasks({ ...filter, projectId });
  }

  async createTask(taskData: TaskCreateRequest): Promise<Task> {
    logger.info('Creating new task', taskData);

    const task = await this.apiClient.post<Task>('/task', taskData);
    
    logger.info(`Created task: ${task.title} (${task.id})`);
    return task;
  }

  async updateTask(taskId: string, updates: TaskUpdateRequest): Promise<Task> {
    logger.info(`Updating task: ${taskId}`, updates);

    const task = await this.apiClient.post<Task>(`/task/${taskId}`, updates);
    
    logger.info(`Updated task: ${task.title}`);
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    logger.info(`Deleting task: ${taskId}`);
    
    await this.apiClient.delete(`/task/${taskId}`);
    
    logger.info(`Deleted task: ${taskId}`);
  }

  async completeTask(taskId: string): Promise<Task> {
    logger.info(`Completing task: ${taskId}`);
    
    return this.updateTask(taskId, { 
      status: TaskStatus.COMPLETED,
      completedTime: new Date().toISOString(),
      progress: 100
    });
  }

  async uncompleteTask(taskId: string): Promise<Task> {
    logger.info(`Uncompleting task: ${taskId}`);
    
    return this.updateTask(taskId, { 
      status: TaskStatus.ACTIVE,
      progress: 0
    });
  }

  async moveTask(taskId: string, targetProjectId: string): Promise<Task> {
    logger.info(`Moving task ${taskId} to project ${targetProjectId}`);
    
    return this.updateTask(taskId, { projectId: targetProjectId });
  }

  async addChecklistItem(taskId: string, item: Omit<ChecklistItem, 'id' | 'completedTime'>): Promise<Task> {
    logger.info(`Adding checklist item to task: ${taskId}`, item);
    
    const task = await this.getTask(taskId);
    const items = task.items || [];
    
    const newItem: ChecklistItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: TaskStatus.ACTIVE,
    };
    
    items.push(newItem);
    
    return this.updateTask(taskId, { items });
  }

  async updateChecklistItem(taskId: string, itemId: string, updates: Partial<ChecklistItem>): Promise<Task> {
    logger.info(`Updating checklist item ${itemId} in task: ${taskId}`, updates);
    
    const task = await this.getTask(taskId);
    const items = task.items || [];
    
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Checklist item ${itemId} not found in task ${taskId}`);
    }
    
    items[itemIndex] = { ...items[itemIndex], ...updates };
    
    return this.updateTask(taskId, { items });
  }

  async removeChecklistItem(taskId: string, itemId: string): Promise<Task> {
    logger.info(`Removing checklist item ${itemId} from task: ${taskId}`);
    
    const task = await this.getTask(taskId);
    const items = (task.items || []).filter(item => item.id !== itemId);
    
    return this.updateTask(taskId, { items });
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

  async getTasksWithPriority(priority: Priority, projectId?: string): Promise<Task[]> {
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