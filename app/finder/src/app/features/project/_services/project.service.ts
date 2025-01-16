import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectOverview } from '../_models/project-overview.model';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';
import { Project } from '../_models/project-detail.model';

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
    this.loggerService.log('fetching projects');
    return this.httpClient.get<ProjectOverview[]>(
      `${this.baseUrl}/api/project`,
    );
  }

  getProject(id: string) {
    this.loggerService.log('fetching project');
    return this.httpClient.get<Project>(`${this.baseUrl}/api/project/${id}`);
  }

  addProject(projectName: string) {
    this.loggerService.log('fetching project');
    return this.httpClient.post<ProjectOverview>(
      `${this.baseUrl}/api/project`,
      {
        name: projectName,
      },
    );
  }

  updateProject(id: string, projectName: string) {
    this.loggerService.log('fetching project');
    return this.httpClient.put<ProjectOverview>(
      `${this.baseUrl}/api/project/${id}`,
      {
        name: projectName,
      },
    );
  }

  deleteProject(id: string) {
    this.loggerService.log('fetching project');
    return this.httpClient.delete(`${this.baseUrl}/api/project/${id}`);
  }
}
