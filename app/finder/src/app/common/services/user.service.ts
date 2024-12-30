import { Injectable } from '@angular/core';
import { environment } from '../env/environment';
import { LoggerService } from './logger.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = environment.baseUrl;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly httpClient: HttpClient,
  ) {}

  getUser() {
    this.loggerService.log('fetching user');
    return this.httpClient.get<User>(`${this.baseUrl}/api/auth/who`);
  }

  requestLoginMail(email: string, redirectUrl?: string) {
    this.loggerService.log('request login email');
    return this.httpClient.post<void>(
      `${this.baseUrl}/api/auth/requestLoginMail`,
      {
        email,
        redirectUrl,
      },
    );
  }

  loginByToken(loginToken: string) {
    this.loggerService.log('login by token');
    return this.httpClient.post<string>(`${this.baseUrl}/api/auth/tokenLogin`, {
      loginToken,
    });
  }

  loginByCode(email: string, loginCode: string) {
    this.loggerService.log('login by code');
    return this.httpClient.post<string>(`${this.baseUrl}/api/auth/codeLogin`, {
      email,
      loginCode,
    });
  }

  updateName(name: string) {
    this.loggerService.log('update name');
    return this.httpClient.post<User>(`${this.baseUrl}/api/auth/name`, {
      name,
    });
  }

  logout() {
    this.loggerService.log('log out');
    return this.httpClient.post<void>(`${this.baseUrl}/api/auth/logout`, {});
  }
}
