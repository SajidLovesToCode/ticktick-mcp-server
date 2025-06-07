/**
 * Projects API Implementation
 */

import { TickTickAPIClient } from '../common/api-client.js';
import { 
  Project, 
  ProjectCreateRequest, 
  ProjectUpdateRequest, 
  ProjectFilter 
} from './project-types.js';
import { logger } from '../../utils/logger.js';

export class ProjectsAPI {
  constructor(private apiClient: TickTickAPIClient) {}

  async getAllProjects(filter?: ProjectFilter): Promise<Project[]> {
    logger.info('Fetching all projects', filter);

    const params: Record<string, any> = {};
    
    if (filter?.kind) params.kind = filter.kind;
    if (filter?.closed !== undefined) params.closed = filter.closed;
    if (filter?.muted !== undefined) params.muted = filter.muted;
    if (filter?.search) params.search = filter.search;

    const projects = await this.apiClient.get<Project[]>('/project', params);
    
    logger.info(`Retrieved ${projects.length} projects`);
    return projects;
  }

  async getProject(projectId: string): Promise<Project> {
    logger.info(`Fetching project: ${projectId}`);
    
    const project = await this.apiClient.get<Project>(`/project/${projectId}`);
    
    logger.info(`Retrieved project: ${project.name}`);
    return project;
  }

  async createProject(projectData: ProjectCreateRequest): Promise<Project> {
    logger.info('Creating new project', projectData);

    const project = await this.apiClient.post<Project>('/project', projectData);
    
    logger.info(`Created project: ${project.name} (${project.id})`);
    return project;
  }

  async updateProject(projectId: string, updates: ProjectUpdateRequest): Promise<Project> {
    logger.info(`Updating project: ${projectId}`, updates);

    const project = await this.apiClient.post<Project>(`/project/${projectId}`, updates);
    
    logger.info(`Updated project: ${project.name}`);
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    logger.info(`Deleting project: ${projectId}`);
    
    await this.apiClient.delete(`/project/${projectId}`);
    
    logger.info(`Deleted project: ${projectId}`);
  }

  async getProjectStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  }> {
    logger.info(`Fetching project statistics: ${projectId}`);

    // TickTick API doesn't provide direct stats endpoint, so we'll calculate from tasks
    const tasks = await this.apiClient.get<any[]>(`/project/${projectId}/task`);
    
    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 2).length,
      inProgressTasks: tasks.filter(task => task.status === 0).length,
      overdueTasks: tasks.filter(task => 
        task.status !== 2 && 
        task.dueDate && 
        new Date(task.dueDate) < now
      ).length,
    };

    logger.info(`Project stats for ${projectId}:`, stats);
    return stats;
  }

  async archiveProject(projectId: string): Promise<Project> {
    logger.info(`Archiving project: ${projectId}`);
    
    return this.updateProject(projectId, { closed: true });
  }

  async unarchiveProject(projectId: string): Promise<Project> {
    logger.info(`Unarchiving project: ${projectId}`);
    
    return this.updateProject(projectId, { closed: false });
  }

  async muteProject(projectId: string): Promise<Project> {
    logger.info(`Muting project: ${projectId}`);
    
    return this.updateProject(projectId, { muted: true });
  }

  async unmuteProject(projectId: string): Promise<Project> {
    logger.info(`Unmuting project: ${projectId}`);
    
    return this.updateProject(projectId, { muted: false });
  }
}