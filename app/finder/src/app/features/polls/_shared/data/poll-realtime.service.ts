import { inject, Injectable, NgZone, signal } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { filter, Observable, Subject } from 'rxjs';
import { environment } from '@common/env/environment';
import { LoggerService } from '@common/services/logger.service';
import { UserStore } from '@common/data/user.store';
import {
    PollChangedNotification,
    PollParticipant,
} from '../models/poll-realtime.model';

/**
 * Presence + change-signalling channel for the poll detail page. SignalR is used purely for
 * signalling: the socket never carries poll data — it announces who is present and pings when a
 * poll changed. The actual data still comes over REST (the delta endpoint), so authorization and
 * DTO contracts stay in one place.
 *
 * One connection is shared across the app; a single poll detail page is open at a time, so the
 * service tracks the active poll and re-joins it after an automatic reconnect (SignalR groups are
 * dropped when the connection id changes).
 */
@Injectable({ providedIn: 'root' })
export class PollRealtimeService {
    private readonly loggerService = inject(LoggerService);
    private readonly userStore = inject(UserStore);
    private readonly zone = inject(NgZone);

    private connection?: HubConnection;
    private activePollId?: string;

    /**
     * Client heartbeat. While the user interacts with the poll they count as "actively present"
     * server-side, which suppresses their redundant e-mail notifications; once they stop
     * interacting (or background the tab) their activity ages out and notifications resume. Sends
     * are throttled well under the server idle window so a single interaction keeps them active.
     */
    private static readonly ACTIVITY_EVENTS = [
        'pointerdown',
        'keydown',
        'scroll',
        'pointermove',
    ];
    private static readonly ACTIVITY_THROTTLE_MS = 20_000;
    private stopActivityTracking?: () => void;
    private lastActivitySentAt = 0;

    /** Roster of everyone currently on the active poll (including the local user). */
    readonly presence = signal<PollParticipant[]>([]);

    private readonly pollChangedSubject =
        new Subject<PollChangedNotification>();

    /**
     * Emits when someone else changed the poll. Self-originated pings are dropped by comparing the
     * ping's actor id to the current user, so the user's own edits don't trigger a redundant delta
     * fetch or highlight their own change.
     */
    readonly pollChanged$: Observable<PollChangedNotification> =
        this.pollChangedSubject.asObservable().pipe(
            filter((change) => {
                const selfId = this.userStore.user()?.id;
                return !selfId || change.actorUserId !== selfId;
            }),
        );

    /** Connect (if needed) and join the poll's presence group. */
    async joinPoll(pollId: string): Promise<void> {
        this.activePollId = pollId;
        // Joining already stamps activity server-side, so hold off the first heartbeat.
        this.lastActivitySentAt = Date.now();
        this.startActivityTracking();
        try {
            await this.ensureConnected();
            await this.connection!.invoke('JoinPoll', pollId);
        } catch (error) {
            this.loggerService.log(
                '[PollRealtimeService] Failed to join poll',
                pollId,
                error,
            );
        }
    }

    /** Leave the poll's presence group. Keeps the connection open for reuse. */
    async leavePoll(pollId: string): Promise<void> {
        if (this.activePollId === pollId) {
            this.activePollId = undefined;
        }
        this.stopActivityTracking?.();
        this.presence.set([]);
        if (this.connection?.state !== HubConnectionState.Connected) {
            return;
        }
        try {
            await this.connection.invoke('LeavePoll', pollId);
        } catch (error) {
            this.loggerService.log(
                '[PollRealtimeService] Failed to leave poll',
                pollId,
                error,
            );
        }
    }

    /**
     * Attach interaction listeners for the active poll. Runs outside the Angular zone so the
     * high-frequency events (pointermove, scroll) never trigger change detection — the handler only
     * fires a throttled network ping and touches no signals.
     */
    private startActivityTracking(): void {
        if (this.stopActivityTracking || typeof document === 'undefined') {
            return;
        }
        const handler = () => this.onUserActivity();
        this.zone.runOutsideAngular(() => {
            for (const event of PollRealtimeService.ACTIVITY_EVENTS) {
                document.addEventListener(event, handler, { passive: true });
            }
        });
        this.stopActivityTracking = () => {
            for (const event of PollRealtimeService.ACTIVITY_EVENTS) {
                document.removeEventListener(event, handler);
            }
            this.stopActivityTracking = undefined;
        };
    }

    private onUserActivity(): void {
        // A backgrounded tab isn't really being watched — let it age into idle server-side.
        if (document.hidden) {
            return;
        }
        const now = Date.now();
        if (
            now - this.lastActivitySentAt <
            PollRealtimeService.ACTIVITY_THROTTLE_MS
        ) {
            return;
        }
        this.lastActivitySentAt = now;
        void this.sendActivity();
    }

    private async sendActivity(): Promise<void> {
        const pollId = this.activePollId;
        if (
            !pollId ||
            this.connection?.state !== HubConnectionState.Connected
        ) {
            return;
        }
        try {
            await this.connection.invoke('ReportActivity', pollId);
        } catch (error) {
            this.loggerService.log(
                '[PollRealtimeService] Failed to report activity',
                pollId,
                error,
            );
        }
    }

    private async ensureConnected(): Promise<void> {
        if (this.connection?.state === HubConnectionState.Connected) {
            return;
        }
        if (!this.connection) {
            this.connection = this.buildConnection();
        }
        if (this.connection.state === HubConnectionState.Disconnected) {
            await this.connection.start();
        }
    }

    private buildConnection(): HubConnection {
        const connection = new HubConnectionBuilder()
            .withUrl(`${environment.baseUrl}/hub/poll`)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        connection.on('PresenceChanged', (roster: PollParticipant[]) => {
            this.presence.set(roster ?? []);
        });

        connection.on('PollChanged', (change: PollChangedNotification) => {
            this.pollChangedSubject.next(change);
        });

        // Groups are per-connection; a reconnect gets a fresh connection id and loses the join, so
        // re-join the active poll to restore presence and change pings.
        connection.onreconnected(() => {
            if (this.activePollId) {
                connection
                    .invoke('JoinPoll', this.activePollId)
                    .catch((error) =>
                        this.loggerService.log(
                            '[PollRealtimeService] Failed to re-join poll after reconnect',
                            this.activePollId,
                            error,
                        ),
                    );
            }
        });

        return connection;
    }
}
