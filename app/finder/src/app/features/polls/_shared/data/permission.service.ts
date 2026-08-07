import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedWith, SharingContact, VisibilityType } from '../models/poll-detail.model';
import { LoggerService } from '../../../../common/services/logger.service';
import { environment } from '../../../../common/env/environment';

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

  updateVisibilityType(projectId: string, type: VisibilityType) {
    return this.httpClient.put<void>(
      `${this.baseUrl}/api/permission/type/${projectId}`,
      { type },
    );
  }

  getContacts(projectId: string) {
    return this.httpClient.get<SharingContact[]>(
      `${this.baseUrl}/api/permission/contacts/${projectId}`,
    );
  }

  removePermission(projectId: string, email: string) {
    return this.httpClient.delete<SharedWith[]>(
      `${this.baseUrl}/api/permission/${projectId}/${encodeURIComponent(email)}`,
    );
  }
}
