import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@common/env/environment';
import {
    FeedbackConfig,
    FeedbackPreference,
    SubmitFeedbackRequest,
} from '../_models/feedback.model';

@Injectable({
    providedIn: 'root',
})
export class FeedbackService {
    private readonly httpClient = inject(HttpClient);
    private readonly baseUrl = environment.baseUrl;

    getConfig() {
        return this.httpClient.get<FeedbackConfig>(
            `${this.baseUrl}/api/feedback/config`,
        );
    }

    getPreference() {
        return this.httpClient.get<FeedbackPreference>(
            `${this.baseUrl}/api/feedback/preference`,
        );
    }

    updatePreference(buttonHidden: boolean) {
        return this.httpClient.put<FeedbackPreference>(
            `${this.baseUrl}/api/feedback/preference`,
            { buttonHidden },
        );
    }

    submit(request: SubmitFeedbackRequest) {
        return this.httpClient.post<void>(
            `${this.baseUrl}/api/feedback`,
            request,
        );
    }
}
