import { z } from 'zod';

// Priority values based on TickTick API
export const TaskPrioritySchema = z.enum(['0', '1', '3', '5']).describe('Task priority (0=None, 1=Low, 3=Medium, 5=High)');

// Task status values
export const TaskStatusSchema = z.enum(['0', '1', '2']).describe('Task status (0=Active, 1=Completed, 2=Deleted)');

// Date validation - accepts ISO strings and converts to TickTick format
export const DateSchema = z.string().datetime().optional().describe('ISO 8601 datetime string');

// Checklist item schema
export const ChecklistItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(1000),
  status: z.enum(['0', '1']).default('0'),
  sortOrder: z.number().optional(),
});

// Reminder schema
export const ReminderSchema = z.object({
  id: z.string().optional(),
  trigger: z.string().describe('Trigger time in TickTick format'),
});

// Tag schema
export const TagSchema = z.string().min(1).max(100);

// Base task fields shared between create and update
const BaseTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(5000).optional(),
  desc: z.string().max(5000).optional(),
  allDay: z.boolean().optional(),
  startDate: DateSchema,
  dueDate: DateSchema,
  timeZone: z.string().optional(),
  isFloating: z.boolean().optional(),
  priority: TaskPrioritySchema.optional(),
  status: TaskStatusSchema.optional(),
  items: z.array(ChecklistItemSchema).optional(),
  reminders: z.array(ReminderSchema).optional(),
  repeatFlag: z.string().optional(),
  repeatFrom: z.string().optional(),
  repeatTaskId: z.string().optional(),
  tags: z.array(TagSchema).optional(),
  columnId: z.string().optional(),
  sortOrder: z.number().optional(),
  kind: z.enum(['TEXT', 'NOTE', 'CHECKLIST']).optional(),
});

// Task creation schema
export const CreateTaskSchema = z.object({
  projectId: z.string().uuid().describe('Project ID where the task will be created'),
  title: z.string().min(1).max(255).describe('Task title'),
  content: z.string().max(5000).optional().describe('Task description'),
  desc: z.string().max(5000).optional().describe('Task description (alias for content)'),
  allDay: z.boolean().optional().describe('Whether the task is all-day'),
  startDate: DateSchema.describe('Task start date'),
  dueDate: DateSchema.describe('Task due date'),
  timeZone: z.string().optional().describe('Time zone for the task'),
  isFloating: z.boolean().optional().describe('Whether the task has floating time'),
  priority: TaskPrioritySchema.optional(),
  status: TaskStatusSchema.optional(),
  items: z.array(ChecklistItemSchema).optional().describe('Checklist items'),
  reminders: z.array(ReminderSchema).optional().describe('Task reminders'),
  repeatFlag: z.string().optional().describe('Repeat pattern'),
  repeatFrom: z.string().optional().describe('Repeat from date'),
  repeatTaskId: z.string().optional().describe('Parent repeat task ID'),
  tags: z.array(TagSchema).optional().describe('Task tags'),
  columnId: z.string().optional().describe('Column ID for kanban view'),
  sortOrder: z.number().optional().describe('Sort order'),
  kind: z.enum(['TEXT', 'NOTE', 'CHECKLIST']).optional().describe('Task type'),
});

// Task update schema
export const UpdateTaskSchema = z.object({
  taskId: z.string().describe('Task ID to update'),
  projectId: z.string().uuid().describe('Project ID containing the task'),
  ...BaseTaskSchema.shape,
});

// Complete task schema
export const CompleteTaskSchema = z.object({
  projectId: z.string().uuid().describe('Project ID containing the task'),
  taskId: z.string().describe('Task ID to complete'),
});

// Delete task schema
export const DeleteTaskSchema = z.object({
  projectId: z.string().uuid().describe('Project ID containing the task'),
  taskId: z.string().describe('Task ID to delete'),
});

// List tasks filter schema
export const ListTasksFilterSchema = z.object({
  projectId: z.string().uuid().optional().describe('Filter by project ID'),
  status: TaskStatusSchema.optional().describe('Filter by status'),
  priority: TaskPrioritySchema.optional().describe('Filter by priority'),
  tag: z.string().optional().describe('Filter by tag'),
  startDate: DateSchema.describe('Filter by start date'),
  dueDate: DateSchema.describe('Filter by due date'),
  search: z.string().optional().describe('Search in title and content'),
  sortBy: z.enum(['dueDate', 'priority', 'title', 'createdTime', 'modifiedTime']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Get task schema
export const GetTaskSchema = z.object({
  taskId: z.string().describe('Task ID to retrieve'),
  projectId: z.string().uuid().optional().describe('Project ID (helps locate the task faster)'),
});

// Search tasks schema
export const SearchTasksSchema = z.object({
  query: z.string().min(1).max(100).describe('Search query'),
  projectId: z.string().uuid().optional().describe('Limit search to specific project'),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// Type exports
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;
export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>;
export type ListTasksFilter = z.infer<typeof ListTasksFilterSchema>;
export type GetTaskInput = z.infer<typeof GetTaskSchema>;
export type SearchTasksInput = z.infer<typeof SearchTasksSchema>;