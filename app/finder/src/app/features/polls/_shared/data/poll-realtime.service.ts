import { inject, Injectable, signal } from '@angular/core';
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

    private connection?: HubConnection;
    private activePollId?: string;

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
