import type { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail, SharedWith } from '../models/poll-detail.model';

/** A vote counts as "voted" when its choice is a positive number. */
export function hasVoted(choice: string | null | undefined): boolean {
    return parseInt(choice ?? '0') > 0;
}

/**
 * The choice that clears a vote: a negative "skipped" value, one lower than any previous skip,
 * so the option is offered again in the vote flow (see `poll-vote.component.ts`).
 */
export function resetChoice(current: string | null | undefined): string {
    const choice = parseInt(current ?? '0') || 0;
    return (Math.min(choice, 0) - 1).toString();
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

/** Whether `person` has cast a real (positive) vote on the option. */
export function personVoted(option: OptionDetail, person: string): boolean {
    return votedNames(option).has(person);
}

/**
 * Avatar list for an option: falls back to the members list (marking who voted)
 * when the poll is shared, otherwise the raw voters. `exclude` drops one person
 * (the option's creator, who is rendered separately).
 */
export function avatarUsers(
    option: OptionDetail,
    members: SharedWith[],
    exclude?: string,
): AvatarUser[] {
    const voted = votedNames(option);
    const users = members.length
        ? members.map((m) => ({ name: m.name, voted: voted.has(m.name) }))
        : option.votes.map((v) => ({
              name: v.person,
              voted: hasVoted(v.choice),
          }));
    return exclude === undefined
        ? users
        : users.filter((u) => u.name !== exclude);
}
