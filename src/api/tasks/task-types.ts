/**
 * Task Types for TickTick API
 */

import { TickTickBaseEntity, Tag, Location, Attachment, Comment } from '../common/types.js';

export interface Task extends TickTickBaseEntity {
  projectId: string;
  title: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  sortOrder: number;
  items?: ChecklistItem[];
  tags?: Tag[];
  attachments?: Attachment[];
  comments?: Comment[];
  assignee?: string;
  location?: Location;
  focus?: number;
  completedTime?: string;
  deleted?: number;
  etag?: string;
}

export enum TaskStatus {
  ACTIVE = 0,
  COMPLETED = 2,
  DELETED = -1,
}

export enum TaskPriority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 3,
  HIGH = 5,
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: TaskStatus;
  completedTime?: string;
  sortOrder: number;
  startDate?: string;
  isAllDay?: boolean;
  timeZone?: string;
}

export interface Subtask extends TickTickBaseEntity {
  parentId: string;
  title: string;
  status: TaskStatus;
  completedTime?: string;
  sortOrder: number;
}

export interface TaskCreateRequest {
  projectId: string;
  title: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority?: TaskPriority;
  tags?: Tag[];
  assignee?: string;
  location?: Location;
  items?: Omit<ChecklistItem, 'id' | 'completedTime'>[];
  sortOrder?: number;
}

export interface TaskUpdateRequest {
  id?: string;
  projectId: string; // Required by TickTick API specification
  title?: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  tags?: Tag[];
  assignee?: string;
  location?: Location;
  items?: ChecklistItem[];
  completedTime?: string;
  sortOrder?: number;
}

export interface TaskFilter {
  // Server-side filters (supported by TickTick API through project data)
  projectId?: string;
  
  // Client-side filters (applied after fetching from /project/{id}/data)
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  search?: string;
  startDate?: string;    // Filter by due date >= startDate
  endDate?: string;      // Filter by due date <= endDate
  completedAfter?: string;
  completedBefore?: string;
  hasReminder?: boolean;
  hasAttachment?: boolean;
  isOverdue?: boolean;
}

export interface TaskSortOptions {
  field: 'dueDate' | 'priority' | 'title' | 'createdTime' | 'modifiedTime' | 'completedTime';
  direction: 'asc' | 'desc';
}