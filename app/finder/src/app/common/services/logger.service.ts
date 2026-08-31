/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
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
