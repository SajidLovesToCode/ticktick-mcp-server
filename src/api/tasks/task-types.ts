/**
 * Task Types for TickTick API
 */

import { TickTickBaseEntity, Tag, Priority, Reminder, Location, Attachment, Comment } from '../common/types.js';

export interface Task extends TickTickBaseEntity {
  projectId: string;
  title: string;
  content?: string;
  desc?: string;
  allDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminder?: string;
  reminders?: Reminder[];
  repeat?: string;
  priority: Priority;
  status: TaskStatus;
  progress: number;
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

export interface ChecklistItem {
  id: string;
  title: string;
  status: TaskStatus;
  completedTime?: string;
  sortOrder: number;
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
  allDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminder?: string;
  reminders?: Omit<Reminder, 'id'>[];
  repeat?: string;
  priority?: Priority;
  tags?: Tag[];
  assignee?: string;
  location?: Location;
  items?: Omit<ChecklistItem, 'id' | 'completedTime'>[];
}

export interface TaskUpdateRequest {
  title?: string;
  content?: string;
  desc?: string;
  allDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminder?: string;
  reminders?: Reminder[];
  repeat?: string;
  priority?: Priority;
  status?: TaskStatus;
  progress?: number;
  tags?: Tag[];
  assignee?: string;
  location?: Location;
  items?: ChecklistItem[];
  projectId?: string; // For moving tasks
  completedTime?: string;
}

export interface TaskFilter {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  completedAfter?: string;
  completedBefore?: string;
  modifiedAfter?: string;
  modifiedBefore?: string;
  hasReminder?: boolean;
  hasAttachment?: boolean;
  isOverdue?: boolean;
}

export interface TaskSortOptions {
  field: 'dueDate' | 'priority' | 'title' | 'createdTime' | 'modifiedTime' | 'completedTime';
  direction: 'asc' | 'desc';
}