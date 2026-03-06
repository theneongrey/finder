import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../common/env/environment';
import { LoggerService } from '../../../common/services/logger.service';
import { SharedWith } from '../_models/project-detail.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly loggerService = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);

  private readonly baseUrl = environment.baseUrl;

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
