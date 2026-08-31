export interface OptionDisplay {
    id: string;
    text: string;
    description: string;
    voteCount: number;
    pct: string;
    isLead: boolean;
}

export interface ParticipantDisplay {
    name: string;
    hasVoted: boolean;
    user: { name: string };
}
