import { Injectable } from '@angular/core';
import { environment } from '../env/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor() {}

  log(...params: any[]) {
    console.log(...params);
  }
}
