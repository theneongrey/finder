import { OptionType } from '@common/models/option-type.model';
import { Comment, OptionDetail } from './poll-detail.model';

/** Poll-level fields, present only when the poll itself changed since the client's token. */
export interface PollDeltaPoll {
    id: string;
    name: string;
    description: string;
    optionType: OptionType;
    closeDate?: string;
    isClosed: boolean;
}

/**
 * Changes to a poll since a sync token. Options and comments are upserted by id; anything whose id
 * is missing from the `current*Ids` sets has been hard-deleted and is dropped. `syncToken` is
 * echoed back as `since` on the next call.
 */
export interface PollDelta {
    poll?: PollDeltaPoll;
    options: OptionDetail[];
    comments: Comment[];
    currentOptionIds: string[];
    currentCommentIds: string[];
    syncToken: string;
}
