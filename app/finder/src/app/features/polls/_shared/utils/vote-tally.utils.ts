import type { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail, SharedWith } from '../models/poll-detail.model';

/** A vote counts as "voted" when its choice is a positive number. */
function hasVoted(choice: string | null | undefined): boolean {
    return parseInt(choice ?? '0') > 0;
}

export function yesVotes(option: OptionDetail) {
    return option.votes.filter((v) => v.choice === '1');
}

export function maybeVotes(option: OptionDetail) {
    return option.votes.filter((v) => v.choice === '3');
}

export function noVotes(option: OptionDetail) {
    return option.votes.filter((v) => v.choice === '2');
}

export function totalVoters(option: OptionDetail): number {
    return option.votes.filter((v) => hasVoted(v.choice)).length;
}

function ratedVotes(option: OptionDetail) {
    return option.votes.filter(
        (v) => v.choice && !isNaN(parseInt(v.choice)) && parseInt(v.choice) > 0,
    );
}

export function averageRating(option: OptionDetail): number {
    const rated = ratedVotes(option);
    if (!rated.length) {
        return 0;
    }
    return (
        rated.reduce((sum, v) => sum + parseInt(v.choice!), 0) / rated.length
    );
}

export function ratingsCount(option: OptionDetail): number {
    return ratedVotes(option).length;
}

function votedNames(option: OptionDetail): Set<string> {
    return new Set(
        option.votes.filter((v) => hasVoted(v.choice)).map((v) => v.person),
    );
}

/**
 * Avatar list for an option: falls back to the members list (marking who voted)
 * when the poll is shared, otherwise the raw voters.
 */
export function avatarUsers(
    option: OptionDetail,
    members: SharedWith[],
): AvatarUser[] {
    const voted = votedNames(option);
    if (members.length) {
        return members.map((m) => ({ name: m.name, voted: voted.has(m.name) }));
    }
    return option.votes.map((v) => ({
        name: v.person,
        voted: hasVoted(v.choice),
    }));
}
