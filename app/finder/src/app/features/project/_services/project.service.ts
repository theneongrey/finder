import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectOverview } from '../_models/project-overview.model';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';
import { Option, Project, Topic } from '../_models/project-detail.model';
import { CreateOption } from '../_models/create-option.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly baseUrl = environment.baseUrl;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly httpClient: HttpClient,
  ) {}

  getProjects() {
    this.loggerService.debug('[ProjectService] fetching projects');
    return this.httpClient.get<ProjectOverview[]>(
      `${this.baseUrl}/api/project`,
    );
  }

  getProject(id: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.get<Project>(`${this.baseUrl}/api/project/${id}`);
  }

  addProject(projectName: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.post<ProjectOverview>(
      `${this.baseUrl}/api/project`,
      {
        name: projectName,
      },
    );
  }

  updateProject(id: string, projectName: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.put<ProjectOverview>(
      `${this.baseUrl}/api/project/${id}`,
      {
        name: projectName,
      },
    );
  }

  deleteProject(id: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.delete(`${this.baseUrl}/api/project/${id}`);
  }

  addTopic(projectId: string, name: string, options: CreateOption[]) {
    this.loggerService.debug(`[ProjectService] adding topic ${name}`);
    return this.httpClient.post<Topic>(`${this.baseUrl}/api/project/topic`, {
      name: name,
      projectId: projectId,
      options: options,
    });
  }

  deleteTopic(topicId: string) {
    this.loggerService.debug(`[ProjectService] deleting topic ${topicId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/topic/${topicId}`,
    );
  }
}
