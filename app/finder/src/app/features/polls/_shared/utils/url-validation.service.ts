import { Injectable } from '@angular/core';

const URL_REGEX = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([/?#].*)?$/i;

@Injectable({ providedIn: 'root' })
export class UrlValidationService {
    isValid(value: string): boolean {
        if (!value) {
            return true;
        }
        return URL_REGEX.test(value);
    }

    normalize(value: string): string {
        if (!value || /^https?:\/\//i.test(value)) {
            return value;
        }
        return `https://${value}`;
    }
}
