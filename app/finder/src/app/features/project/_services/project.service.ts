import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectOverview } from '../_models/project-overview.model';
import { StandalonePollOverview } from '../_models/standalone-topic-overview.model';
import {
  Comment,
  Option,
  OptionMeta,
  OptionType,
  Poll,
  PollDetail,
  Project,
} from '../_models/project-detail.model';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';

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

  getStandalonePolls() {
    this.loggerService.debug('[ProjectService] fetching standalone polls');
    return this.httpClient.get<StandalonePollOverview[]>(
      `${this.baseUrl}/api/project/standalone-polls`,
    );
  }

  addStandalonePoll(name: string, description: string, optionType: OptionType) {
    this.loggerService.debug(`[ProjectService] adding standalone poll ${name}`);
    return this.httpClient.post<StandalonePollOverview>(
      `${this.baseUrl}/api/project/standalone-poll`,
      { name, description, optionType },
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

  getPoll(id: string) {
    this.loggerService.debug('[ProjectService] fetching poll');
    return this.httpClient.get<PollDetail>(
      `${this.baseUrl}/api/project/poll/${id}`,
    );
  }

  addPoll(
    projectId: string,
    name: string,
    optionType: OptionType,
    description: string,
  ) {
    this.loggerService.debug(`[ProjectService] adding poll ${name}`);
    return this.httpClient.post<Poll>(`${this.baseUrl}/api/project/poll`, {
      name: name,
      projectId: projectId,
      optionType: optionType,
      description: description,
    });
  }

  updatePoll(pollId: string, name: string, description: string) {
    this.loggerService.debug(`[ProjectService] updating poll ${pollId}`);
    return this.httpClient.put<PollDetail>(
      `${this.baseUrl}/api/project/poll/${pollId}`,
      { name, description },
    );
  }

  deletePoll(pollId: string) {
    this.loggerService.debug(`[ProjectService] deleting poll ${pollId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/poll/${pollId}`,
    );
  }

  addOption(pollId: string, text: string, description: string, meta?: OptionMeta) {
    this.loggerService.debug(`[ProjectService] adding option ${text}`);
    return this.httpClient.post<Option>(
      `${this.baseUrl}/api/project/poll/option`,
      { text, description, pollId, meta },
    );
  }

  updateOption(optionId: string, text: string, description: string, meta?: OptionMeta) {
    this.loggerService.debug(`[ProjectService] updating option ${optionId}`);
    return this.httpClient.put<Option>(
      `${this.baseUrl}/api/project/poll/option/${optionId}`,
      { text, description, meta },
    );
  }

  deleteOption(optionId: string) {
    this.loggerService.debug(`[ProjectService] deleting option ${optionId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/poll/option/${optionId}`,
    );
  }

  vote(optionId: string, choice: string) {
    this.loggerService.debug(
      `[ProjectService] voted for ${optionId} with ${choice}`,
    );
    return this.httpClient.put(
      `${this.baseUrl}/api/project/poll/vote/${optionId}`,
      {
        choice,
      },
    );
  }

  addComment(pollId: string, content: string, quote?: string) {
    this.loggerService.debug(
      `[ProjectService] adding comment to poll ${pollId}`,
    );
    return this.httpClient.post<Comment>(
      `${this.baseUrl}/api/project/poll/comment`,
      {
        pollId,
        content,
        quote,
      },
    );
  }
}
