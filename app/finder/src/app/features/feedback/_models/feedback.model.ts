export type FeedbackType = 'Bug' | 'Idea' | 'Other';

export interface SubmitFeedbackRequest {
    type: FeedbackType;
    comment: string;
    page: string;
}

export interface FeedbackPreference {
    buttonHidden: boolean;
}

/** Must match FeedbackService.MaxCommentLength on the backend. */
export const FEEDBACK_MAX_COMMENT_LENGTH = 2000;
