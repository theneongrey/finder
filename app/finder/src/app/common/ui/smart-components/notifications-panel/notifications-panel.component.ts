import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { UserStore } from '../../../data/user.store';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
    InAppNotification,
    InAppNotificationKey,
} from '../../../models/in-app-notification.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';

const NOTIFICATION_TRANSLATION_KEYS: Record<InAppNotificationKey, string> = {
    PollClosed: 'notifications.pollClosed',
    PollReopened: 'notifications.pollReopened',
    PollUpdated: 'notifications.pollUpdated',
    NewComment: 'notifications.newComment',
    AccessChanged: 'notifications.accessChanged',
    PollShared: 'notifications.pollShared',
};

const NOTIFICATION_ICONS: Record<InAppNotificationKey, string> = {
    PollClosed: 'lock',
    PollReopened: 'refresh',
    PollUpdated: 'edit',
    NewComment: 'comment',
    AccessChanged: 'users',
    PollShared: 'share',
};

@Component({
    selector: 'app-notifications-panel',
    imports: [
        ...HlmDropdownMenuImports,
        UserAvatarComponent,
        DsIconComponent,
        TranslatePipe,
        DsButtonComponent,
    ],
    templateUrl: './notifications-panel.component.html',
    styleUrl: './notifications-panel.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class NotificationsPanelComponent {
    private readonly userStore = inject(UserStore);
    private readonly router = inject(Router);

    protected readonly user = this.userStore.user;
    protected readonly inAppNotifications = this.userStore.allNotifications;
    protected readonly unreadCount = this.userStore.unreadCount;

    protected getTranslationKey(key: InAppNotificationKey): string {
        return NOTIFICATION_TRANSLATION_KEYS[key];
    }

    protected getIcon(key: InAppNotificationKey): string {
        return NOTIFICATION_ICONS[key];
    }

    protected relativeTime(created: string): string {
        const diff = Date.now() - new Date(created).getTime();
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) {
            return '<1m';
        }
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h`;
        }
        return `${Math.floor(hours / 24)}d`;
    }

    protected onNotificationClick(notification: InAppNotification): void {
        if (!notification.read) {
            this.userStore.markAsRead(notification.id);
        }
        this.router.navigate([
            '/',
            'polls',
            notification.projectId,
            'vote',
            notification.pollId,
        ]);
    }

    protected onMarkAllAsRead(): void {
        this.userStore.markAllAsRead();
    }

    protected navigateTo(path: string): void {
        this.router.navigate([path]);
    }
}
