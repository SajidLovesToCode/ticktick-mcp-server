/**
 * Common API Types
 */

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface APIRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface TickTickBaseEntity {
  id: string;
  createdTime: string;
  modifiedTime: string;
}

export interface Tag {
  name: string;
  color?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdTime: string;
  modifiedTime: string;
}

export enum Priority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 3,
  HIGH = 5,
}

export enum RepeatType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface Reminder {
  id: string;
  trigger: string;
  repeats?: RepeatType;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}