/** A person currently present on a poll's detail page (from the SignalR presence roster). */
export interface PollParticipant {
    userId: string;
    name?: string;
    picture?: string;
}

/** Thin change ping pushed on the hub whenever a poll is mutated. Carries no poll data —
 *  the client reacts by fetching the delta over REST. */
export interface PollChangedNotification {
    pollId: string;
    actorUserId?: string;
}

/**
 * How often (seconds) the client reports interaction to keep the user marked "actively present".
 * Single source for the heartbeat cadence — adjust here.
 *
 * The idle threshold itself is server-authoritative (backend `Notifications:ActivePresenceIdleSeconds`,
 * default 60s): the server decides when a present user has gone idle and their e-mails resume. This
 * cadence only has to stay comfortably below that threshold so a still-watching user keeps sending
 * activity before it lapses.
 */
export const POLL_ACTIVITY_HEARTBEAT_SECONDS = 20;
