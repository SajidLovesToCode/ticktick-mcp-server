import { z } from 'zod';

// Project view type
export const ProjectViewTypeSchema = z.enum(['list', 'kanban', 'timeline']).describe('Project view type');

// Project kind
export const ProjectKindSchema = z.enum(['TASK', 'NOTE']).describe('Project kind');

// Color schema - TickTick uses specific color codes
export const ProjectColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Hex color code');

// Permission schema
export const PermissionSchema = z.enum(['read', 'write', 'admin']).describe('Permission level');

// Base project fields shared between create and update
const BaseProjectSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Project name'),
  color: ProjectColorSchema,
  sortOrder: z.number().optional().describe('Sort order in project list'),
  closed: z.boolean().optional().describe('Whether the project is archived'),
  muted: z.boolean().optional().describe('Whether notifications are muted'),
  groupId: z.string().optional().describe('Parent folder ID'),
  viewType: ProjectViewTypeSchema.optional(),
  permission: PermissionSchema.optional(),
  kind: ProjectKindSchema.optional(),
});

// Create project schema
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255).describe('Project name'),
  color: ProjectColorSchema.default('#4772FA'),
  sortOrder: z.number().optional().describe('Sort order in project list'),
  closed: z.boolean().optional().default(false),
  muted: z.boolean().optional().default(false),
  groupId: z.string().optional().describe('Parent folder ID'),
  viewType: ProjectViewTypeSchema.optional().default('list'),
  permission: PermissionSchema.optional(),
  kind: ProjectKindSchema.optional().default('TASK'),
});

// Update project schema
export const UpdateProjectSchema = z.object({
  projectId: z.string().uuid().describe('Project ID to update'),
  ...BaseProjectSchema.shape,
});

// Archive/Unarchive project schema (convenience methods)
export const ArchiveProjectSchema = z.object({
  projectId: z.string().uuid().describe('Project ID to archive'),
});

export const UnarchiveProjectSchema = z.object({
  projectId: z.string().uuid().describe('Project ID to unarchive'),
});

// Delete project schema
export const DeleteProjectSchema = z.object({
  projectId: z.string().uuid().describe('Project ID to delete'),
});

// Get project schema
export const GetProjectSchema = z.object({
  projectId: z.string().uuid().describe('Project ID to retrieve'),
  includeStats: z.boolean().optional().default(false).describe('Include task statistics'),
});

// List projects schema
export const ListProjectsSchema = z.object({
  includeArchived: z.boolean().optional().default(false).describe('Include archived projects'),
  includeMuted: z.boolean().optional().default(true).describe('Include muted projects'),
  groupId: z.string().optional().describe('Filter by parent folder'),
  kind: ProjectKindSchema.optional().describe('Filter by project kind'),
  sortBy: z.enum(['name', 'sortOrder', 'modifiedTime', 'createdTime']).optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Get project tasks schema
export const GetProjectTasksSchema = z.object({
  projectId: z.string().uuid().describe('Project ID'),
  includeCompleted: z.boolean().optional().default(false).describe('Include completed tasks'),
  sortBy: z.enum(['sortOrder', 'dueDate', 'priority', 'title']).optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Get project stats schema
export const GetProjectStatsSchema = z.object({
  projectId: z.string().uuid().describe('Project ID'),
});

// Type exports
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ArchiveProjectInput = z.infer<typeof ArchiveProjectSchema>;
export type UnarchiveProjectInput = z.infer<typeof UnarchiveProjectSchema>;
export type DeleteProjectInput = z.infer<typeof DeleteProjectSchema>;
export type GetProjectInput = z.infer<typeof GetProjectSchema>;
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;
export type GetProjectTasksInput = z.infer<typeof GetProjectTasksSchema>;
export type GetProjectStatsInput = z.infer<typeof GetProjectStatsSchema>;