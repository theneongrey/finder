import { inject, Injectable } from '@angular/core';
import { environment } from '../env/environment';
import { LoggerService } from './logger.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly loggerService = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);

  private readonly baseUrl = environment.baseUrl;

  getUser() {
    this.loggerService.debug('[User service] fetching user');
    return this.httpClient.get<User>(`${this.baseUrl}/api/auth/who`);
  }

  requestLoginMail(email: string, redirectUrl?: string) {
    this.loggerService.debug(
      `[User service] request login email for ${email} and ${redirectUrl}`,
    );
    return this.httpClient.post<void>(
      `${this.baseUrl}/api/auth/requestLoginMail`,
      {
        email,
        redirectUrl,
      },
    );
  }

  loginByToken(loginToken: string) {
    this.loggerService.debug('[User service] login by token');
    return this.httpClient.post<string>(`${this.baseUrl}/api/auth/tokenLogin`, {
      loginToken,
    });
  }

  loginByCode(email: string, loginCode: string) {
    this.loggerService.debug('[User service] login by code');
    return this.httpClient.post<string>(`${this.baseUrl}/api/auth/codeLogin`, {
      email,
      loginCode,
    });
  }

  updateName(name: string) {
    this.loggerService.debug('[User service] update name');
    return this.httpClient.post<User>(`${this.baseUrl}/api/auth/name`, {
      name,
    });
  }

  logout() {
    this.loggerService.debug('log out');
    return this.httpClient.post<void>(`${this.baseUrl}/api/auth/logout`, {});
  }
}
