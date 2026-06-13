import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectOverview } from '../_models/project-overview.model';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';
import {
  Option,
  OptionType,
  Project,
  Topic,
  TopicDetail,
} from '../_models/project-detail.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly loggerService = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

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

  addProject(name: string, description: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.post<ProjectOverview>(
      `${this.baseUrl}/api/project`,
      {
        name,
        description,
      },
    );
  }

  updateProject(id: string, name: string, description: string) {
    this.loggerService.debug('[ProjectService] updating project');
    return this.httpClient.put<ProjectOverview>(
      `${this.baseUrl}/api/project/${id}`,
      { name, description },
    );
  }

  deleteProject(id: string) {
    this.loggerService.debug('[ProjectService] fetching project');
    return this.httpClient.delete(`${this.baseUrl}/api/project/${id}`);
  }

  getTopic(id: string) {
    this.loggerService.debug('[ProjectService] fetching topic');
    return this.httpClient.get<TopicDetail>(
      `${this.baseUrl}/api/project/topic/${id}`,
    );
  }

  addTopic(projectId: string, name: string, optionType: OptionType) {
    this.loggerService.debug(`[ProjectService] adding topic ${name}`);
    return this.httpClient.post<Topic>(`${this.baseUrl}/api/project/topic`, {
      name: name,
      projectId: projectId,
      optionType: optionType,
    });
  }

  updateTopic(topicId: string, name: string) {
    this.loggerService.debug(`[ProjectService] updating topic ${topicId}`);
    return this.httpClient.put<TopicDetail>(
      `${this.baseUrl}/api/project/topic/${topicId}`,
      { name },
    );
  }

  deleteTopic(topicId: string) {
    this.loggerService.debug(`[ProjectService] deleting topic ${topicId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/topic/${topicId}`,
    );
  }

  addOption(topicId: string, text: string) {
    this.loggerService.debug(`[ProjectService] adding option ${text}`);
    return this.httpClient.post<Option>(
      `${this.baseUrl}/api/project/topic/option`,
      {
        text: text,
        topicId: topicId,
      },
    );
  }

  updateOption(optionId: string, text: string) {
    this.loggerService.debug(`[ProjectService] updating option ${optionId}`);
    return this.httpClient.put<Option>(
      `${this.baseUrl}/api/project/topic/option/${optionId}`,
      { text },
    );
  }

  deleteOption(optionId: string) {
    this.loggerService.debug(`[ProjectService] deleting option ${optionId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/topic/option/${optionId}`,
    );
  }

  vote(optionId: string, choice: string) {
    this.loggerService.debug(
      `[ProjectService] voted for ${optionId} with ${choice}`,
    );
    return this.httpClient.put(
      `${this.baseUrl}/api/project/topic/vote/${optionId}`,
      {
        choice,
      },
    );
  }
}
