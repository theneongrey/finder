import { PollDetail, OptionDetail } from '../models/poll-detail.model';
import { PollDelta } from '../models/poll-delta.model';

export interface PollDeltaMergeResult {
    poll: PollDetail;
    changedOptionIds: string[];
    changedCommentIds: string[];
    /** Remote option updates held back because the local user is editing that option. */
    deferredOptions: OptionDetail[];
}

export const dedupeIds = (ids: string[]) => Array.from(new Set(ids));

/** Insert or replace items by id, returning the ids that were touched. */
function upsertById<T extends { id: string }>(
    items: T[],
    updates: T[],
): { items: T[]; changedIds: string[] } {
    const result = [...items];
    const changedIds: string[] = [];
    for (const update of updates) {
        const index = result.findIndex((i) => i.id === update.id);
        if (index === -1) {
            result.push(update);
        } else {
            result[index] = update;
        }
        changedIds.push(update.id);
    }
    return { items: result, changedIds };
}

/**
 * Patch a poll in place with a delta: upsert changed options/comments by id, drop hard-deleted ones
 * (absent from the `current*Ids` sets) and apply poll-level fields. Options the user is editing are
 * never overwritten or dropped — their remote updates are returned as `deferredOptions` instead.
 */
export function mergePollDelta(
    poll: PollDetail,
    delta: PollDelta,
    editingOptionIds: string[],
): PollDeltaMergeResult {
    const isEditing = (id: string) => editingOptionIds.includes(id);

    const deferredOptions = delta.options.filter((o) => isEditing(o.id));
    const upsertedOptions = upsertById(
        poll.options,
        delta.options.filter((o) => !isEditing(o.id)),
    );
    const keepOptionIds = new Set(delta.currentOptionIds);
    const options = upsertedOptions.items.filter(
        (o) => keepOptionIds.has(o.id) || isEditing(o.id),
    );

    const upsertedComments = upsertById(poll.comments, delta.comments);
    const keepCommentIds = new Set(delta.currentCommentIds);
    const comments = upsertedComments.items.filter((c) =>
        keepCommentIds.has(c.id),
    );

    const pollFields = delta.poll
        ? {
              name: delta.poll.name,
              description: delta.poll.description,
              optionType: delta.poll.optionType,
              closeDate: delta.poll.closeDate,
              isClosed: delta.poll.isClosed,
          }
        : {};

    return {
        poll: { ...poll, ...pollFields, options, comments },
        changedOptionIds: upsertedOptions.changedIds,
        changedCommentIds: upsertedComments.changedIds,
        deferredOptions,
    };
}
