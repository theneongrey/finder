import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectOverview } from '../_models/project-overview.model';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';
import {
  Option,
  OptionType,
  Project,
  SharedWith,
  Topic,
} from '../_models/project-detail.model';
import { CreateOption } from '../_models/create-option.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly baseUrl = environment.baseUrl;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly httpClient: HttpClient,
  ) {}

  share(projectId: string, email: string, permissionType: number) {
    this.loggerService.debug('[PermissionService] fetching projects');
    return this.httpClient.put<SharedWith[]>(
      `${this.baseUrl}/api/permission/${projectId}`,
      {
        email,
        permissionType,
      },
    );
  }
}
