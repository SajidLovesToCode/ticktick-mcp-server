/**
 * Project Types for TickTick API
 */

import { TickTickBaseEntity, Tag } from '../common/types.js';

export interface Project extends TickTickBaseEntity {
  name: string;
  color: string;
  inboxId?: string;
  viewMode: ViewMode;
  permission: Permission;
  kind: ProjectKind;
  sortOrder: number;
  sortType: SortType;
  userCount: number;
  etag: string;
  closed: boolean;
  muted: boolean;
  transferred: boolean;
  groupId?: string;
  timeline?: boolean;
  teamId?: string;
  permission2?: Permission2;
  tags?: Tag[];
}

export enum ViewMode {
  LIST = 'list',
  KANBAN = 'kanban',
  TIMELINE = 'timeline',
}

export enum Permission {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum ProjectKind {
  PERSONAL = 'PERSONAL',
  SHARED = 'SHARED',
  TEAM = 'TEAM',
}

export enum SortType {
  PROJECT = 'project',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  TITLE = 'title',
  ASSIGNEE = 'assignee',
  CREATED_DATE = 'createdDate',
}

export interface Permission2 {
  projectId: string;
  userId: string;
  permission: Permission;
  roles: string[];
}

export interface ProjectCreateRequest {
  name: string;
  color?: string;
  viewMode?: ViewMode;
  kind?: ProjectKind;
  sortType?: SortType;
  timeline?: boolean;
  tags?: Tag[];
}

export interface ProjectUpdateRequest {
  name?: string;
  color?: string;
  viewMode?: ViewMode;
  sortType?: SortType;
  closed?: boolean;
  muted?: boolean;
  timeline?: boolean;
  tags?: Tag[];
}

export interface ProjectFilter {
  kind?: ProjectKind;
  closed?: boolean;
  muted?: boolean;
  search?: string;
}