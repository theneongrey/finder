import { Injectable } from '@angular/core';
import { environment } from '../env/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor() {}

  debug(...params: any[]) {
    console.log(...params);
  }

  log(...params: any[]) {
    console.log(...params);
  }

  error(...params: any[]) {
    console.log(...params);
  }
}
