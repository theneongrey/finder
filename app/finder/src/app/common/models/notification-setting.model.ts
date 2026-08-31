export type NotificationValue = 'off' | 'favOnly' | 'all';

export interface NotificationSetting {
    id: number;
    key: string;
    titleKey: string;
    descriptionKey: string;
    value: NotificationValue;
    sortIndex: number;
    allowedValues: NotificationValue[];
}
