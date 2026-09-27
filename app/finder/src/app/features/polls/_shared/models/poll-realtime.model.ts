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
