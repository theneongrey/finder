import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/**
 * True when the API rejected an edit because someone else saved the same poll/option first
 * (optimistic concurrency: the `version` we sent was stale).
 */
export function isEditConflict(error: unknown): boolean {
    return (
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.PreconditionFailed
    );
}
