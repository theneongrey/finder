export type InAppNotificationKey =
    | 'PollClosed'
    | 'PollReopened'
    | 'PollUpdated'
    | 'NewComment'
    | 'AccessChanged'
    | 'PollShared';

export interface InAppNotification {
    id: string;
    key: InAppNotificationKey;
    projectId?: string;
    pollId?: string;
    variables: Record<string, string>;
    created: string;
    read: boolean;
}
