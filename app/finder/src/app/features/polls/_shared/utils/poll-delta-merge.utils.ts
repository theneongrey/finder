import { PollDetail, OptionDetail } from '../models/poll-detail.model';
import { PollDelta } from '../models/poll-delta.model';
import { extractSlugId } from './slug.utils';

/**
 * How a remote delta touched an option, so the UI can colour the flash:
 * green (added), blue (updated), red (removed).
 */
export type OptionChangeKind = 'added' | 'updated' | 'removed';

/** An option removed remotely, with its former list index so it can linger in place. */
export interface RemovedOption {
    option: OptionDetail;
    index: number;
}

export interface PollDeltaMergeResult {
    poll: PollDetail;
    /** Options to flash, keyed by id → 'added' / 'updated'. Removals are reported separately. */
    optionChanges: Record<string, OptionChangeKind>;
    changedCommentIds: string[];
    /** Options dropped by this delta (hard-deleted remotely), at their former list index. */
    removedOptions: RemovedOption[];
    /** Remote option updates held back because the local user is editing that option. */
    deferredOptions: OptionDetail[];
}

export const dedupeIds = (ids: string[]) => Array.from(new Set(ids));

/**
 * Patch a poll in place with a delta: upsert changed options/comments, drop hard-deleted ones
 * (absent from the `current*Ids` sets) and apply poll-level fields. Options the user is editing are
 * never overwritten or dropped — their remote updates are returned as `deferredOptions` instead.
 *
 * Option identity is the trailing slug id, not the whole slug: the slug encodes the title, so a
 * rename yields a new slug for the same option. Matching on the stable id keeps a rename a single
 * in-place update instead of an add + delete.
 *
 * Only ids in `highlighted*Ids` (changed strictly after the token) are reported as changed; the rest
 * of the delta may be re-sent to cover the boundary overlap and is upserted without re-highlighting.
 */
export function mergePollDelta(
    poll: PollDetail,
    delta: PollDelta,
    editingOptionIds: string[],
): PollDeltaMergeResult {
    const isEditing = (id: string) =>
        editingOptionIds.some(
            (editingId) => extractSlugId(editingId) === extractSlugId(id),
        );

    const deferredOptions: OptionDetail[] = [];
    const optionChanges: Record<string, OptionChangeKind> = {};
    const highlightOptionIds = new Set(delta.highlightedOptionIds);
    let options = [...poll.options];

    for (const option of delta.options) {
        if (isEditing(option.id)) {
            deferredOptions.push(option);
            continue;
        }
        const stableId = extractSlugId(option.id);
        const index = options.findIndex(
            (o) => extractSlugId(o.id) === stableId,
        );
        const isNew = index === -1;
        if (isNew) {
            options.push(option);
        } else {
            options[index] = option;
        }
        if (highlightOptionIds.has(option.id)) {
            optionChanges[option.id] = isNew ? 'added' : 'updated';
        }
    }

    // Reconcile hard-deletes: options absent from the current id-set were removed remotely.
    // Options being edited are exempt (their fate is resolved when the edit ends).
    const keepOptionIds = new Set(delta.currentOptionIds);
    const removedOptions = options
        .map((option, index) => ({ option, index }))
        .filter(
            ({ option }) =>
                !keepOptionIds.has(option.id) && !isEditing(option.id),
        );
    options = options.filter(
        (o) => !removedOptions.some((r) => r.option.id === o.id),
    );

    const highlightCommentIds = new Set(delta.highlightedCommentIds);
    const changedCommentIds: string[] = [];
    let comments = [...poll.comments];
    for (const comment of delta.comments) {
        const index = comments.findIndex((c) => c.id === comment.id);
        if (index === -1) {
            comments.push(comment);
        } else {
            comments[index] = comment;
        }
        if (highlightCommentIds.has(comment.id)) {
            changedCommentIds.push(comment.id);
            // A comment on an option also flashes that option (blue) so the change is visible in
            // the list, not only in the comments panel. Don't override an 'added' flag.
            if (comment.optionId) {
                const stableId = extractSlugId(comment.optionId);
                const opt = options.find(
                    (o) => extractSlugId(o.id) === stableId,
                );
                if (opt && !optionChanges[opt.id]) {
                    optionChanges[opt.id] = 'updated';
                }
            }
        }
    }
    const keepCommentIds = new Set(delta.currentCommentIds);
    comments = comments.filter((c) => keepCommentIds.has(c.id));

    const pollFields = delta.poll
        ? {
              name: delta.poll.name,
              description: delta.poll.description,
              optionType: delta.poll.optionType,
              closeDate: delta.poll.closeDate,
              isClosed: delta.poll.isClosed,
              version: delta.poll.version,
          }
        : {};

    return {
        poll: { ...poll, ...pollFields, options, comments },
        optionChanges,
        changedCommentIds,
        removedOptions,
        deferredOptions,
    };
}
