import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StandalonePollOverview } from '../models/standalone-poll-overview.model';
import {
  Comment,
  Option,
  OptionMeta,
  OptionType,
  PollDetail,
  Project,
  PublicProjectInfo,
} from '../models/poll-detail.model';
import { environment } from '../../../../common/env/environment';
import { LoggerService } from '../../../../common/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private readonly loggerService = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getStandalonePolls() {
    this.loggerService.debug('[PollService] fetching standalone polls');
    return this.httpClient.get<StandalonePollOverview[]>(
      `${this.baseUrl}/api/project/standalone-polls`,
    );
  }

  addStandalonePoll(
    name: string,
    description: string,
    optionType: OptionType,
    closeDate?: string,
  ) {
    this.loggerService.debug(`[PollService] adding standalone poll ${name}`);
    return this.httpClient.post<StandalonePollOverview>(
      `${this.baseUrl}/api/project/standalone-poll`,
      { name, description, optionType, closeDate },
    );
  }

  getPublicProjectInfo(projectId: string) {
    this.loggerService.debug('[PollService] fetching public project info');
    return this.httpClient.get<PublicProjectInfo>(
      `${this.baseUrl}/api/project/public/${projectId}`,
    );
  }

  getProject(id: string) {
    this.loggerService.debug('[PollService] fetching project');
    return this.httpClient.get<Project>(`${this.baseUrl}/api/project/${id}`);
  }

  deleteProject(id: string) {
    this.loggerService.debug('[PollService] fetching project');
    return this.httpClient.delete(`${this.baseUrl}/api/project/${id}`);
  }

  getPoll(id: string) {
    this.loggerService.debug('[PollService] fetching poll');
    return this.httpClient.get<PollDetail>(
      `${this.baseUrl}/api/project/poll/${id}`,
    );
  }

  updatePoll(
    pollId: string,
    name: string,
    description: string,
    closeDate?: string,
  ) {
    this.loggerService.debug(`[PollService] updating poll ${pollId}`);
    return this.httpClient.put<PollDetail>(
      `${this.baseUrl}/api/project/poll/${pollId}`,
      { name, description, closeDate },
    );
  }

  closePoll(pollSlug: string) {
    this.loggerService.debug(`[PollService] closing poll ${pollSlug}`);
    return this.httpClient.post<PollDetail>(
      `${this.baseUrl}/api/polls/${pollSlug}/close`,
      {},
    );
  }

  reopenPoll(pollSlug: string) {
    this.loggerService.debug(`[PollService] reopening poll ${pollSlug}`);
    return this.httpClient.post<PollDetail>(
      `${this.baseUrl}/api/polls/${pollSlug}/reopen`,
      {},
    );
  }

  addOption(
    pollId: string,
    text: string,
    description: string,
    meta?: OptionMeta,
  ) {
    this.loggerService.debug(`[PollService] adding option ${text}`);
    return this.httpClient.post<Option>(
      `${this.baseUrl}/api/project/poll/option`,
      { text, description, pollId, meta },
    );
  }

  updateOption(
    optionId: string,
    text: string,
    description: string,
    meta?: OptionMeta,
  ) {
    this.loggerService.debug(`[PollService] updating option ${optionId}`);
    return this.httpClient.put<Option>(
      `${this.baseUrl}/api/project/poll/option/${optionId}`,
      { text, description, meta },
    );
  }

  deleteOption(optionId: string) {
    this.loggerService.debug(`[PollService] deleting option ${optionId}`);
    return this.httpClient.delete(
      `${this.baseUrl}/api/project/poll/option/${optionId}`,
    );
  }

  vote(optionId: string, choice: string) {
    this.loggerService.debug(
      `[PollService] voted for ${optionId} with ${choice}`,
    );
    return this.httpClient.put(
      `${this.baseUrl}/api/project/poll/vote/${optionId}`,
      {
        choice,
      },
    );
  }

  toggleFavorite(projectSlug: string) {
    this.loggerService.debug(
      `[PollService] toggling favorite for ${projectSlug}`,
    );
    return this.httpClient.patch<{ isFavorite: boolean }>(
      `${this.baseUrl}/api/polls/${projectSlug}/favorite`,
      {},
    );
  }

  addComment(pollId: string, content: string, quote?: string) {
    this.loggerService.debug(`[PollService] adding comment to poll ${pollId}`);
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
