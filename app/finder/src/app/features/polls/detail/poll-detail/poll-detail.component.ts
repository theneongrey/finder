import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
    untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslateService } from '@ngx-translate/core';
import { OptionListComponent } from './option-list/option-list.component';
import { ResultsSkeletonComponent } from './results-skeleton/results-skeleton.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';
import { ResultsToolbarComponent } from './results-toolbar/results-toolbar.component';
import { ResultsShareBarComponent } from './results-share-bar/results-share-bar.component';
import { PollHeaderComponent } from './poll-header/poll-header.component';
import { environment } from '@common/env/environment';
import { TitleBarService } from '@common/services/title-bar.service';
import { PollRole } from '../../_shared/models/poll-role.enum';
import { OptionType } from '@common/models/option-type.model';
import { ShareDrawerComponent } from '@ds/share-drawer/share-drawer.component';
import { DsSideDrawerComponent } from '@ds/side-drawer/ds-side-drawer.component';
import { ShareContentComponent } from '../../_shared/ui/share-content/share-content.component';
import {
    AddOptionPanelComponent,
    NewOptionPayload,
} from './option-input/add-option-panel/add-option-panel.component';
import { EmptyOptionsComponent } from './empty-options/empty-options.component';
import { DateOptionFormatService } from '../../_shared/utils/date-option-format.service';
import {
    DateOptionType,
    isDateOptionType,
    optionTypeHasTime,
    optionTypeToDateType,
} from '../../_shared/models/date-option.model';
import { OptionDetail } from '../../_shared/models/poll-detail.model';
import { UserStore } from '@common/data/user.store';
import { PollVoteComponent } from '../vote/poll-vote.component';
import { PollRealtimeService } from '../../_shared/data/poll-realtime.service';
import {
    PollChangedNotification,
    PollChangeInfo,
} from '../../_shared/models/poll-realtime.model';
import { toast } from '@spartan-ng/brain/sonner';

type SortMode = 'top' | 'original';

/** localStorage key prefix for the per-poll sort choice. */
const POLL_SORT_STORAGE_PREFIX = 'poll-sort:';

/** Change kinds whose `target` is an option's raw text (formatted for date polls before display). */
const OPTION_TARGET_KINDS = new Set([
    'optionRemoved',
    'optionRenamed',
    'optionDescribed',
    'optionUpdated',
    'commentAddedOption',
]);

@Component({
    selector: 'app-poll-detail',
    templateUrl: './poll-detail.component.html',
    styleUrl: './poll-detail.component.css',
    imports: [
        OptionListComponent,
        ResultsSkeletonComponent,
        CommentsSectionComponent,
        ResultsToolbarComponent,
        ResultsShareBarComponent,
        PollHeaderComponent,
        ShareDrawerComponent,
        DsSideDrawerComponent,
        ShareContentComponent,
        AddOptionPanelComponent,
        EmptyOptionsComponent,
        PollVoteComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollDetailComponent {
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly translateService = inject(TranslateService);
    private readonly dateFormat = inject(DateOptionFormatService);
    private readonly userStore = inject(UserStore);
    private readonly realtime = inject(PollRealtimeService);
    private readonly destroyRef = inject(DestroyRef);

    readonly OptionType = OptionType;

    /** Live presence roster and the ids of items changed by recent remote updates. */
    readonly presence = this.realtime.presence;
    readonly selfId = computed(() => this.userStore.user()?.id);
    readonly changedOptions = this.projectDetailStore.changedOptions;
    /** Options for the list: the poll's options plus removed ones still playing their flash. */
    readonly displayOptions = this.projectDetailStore.displayOptions;
    readonly changedCommentIds = this.projectDetailStore.changedCommentIds;

    /** True while a recently-added poll-level comment (no option) is still flashing — drives the
     *  header comment button highlight. Option-level comment flashes live on the option cards. */
    readonly pollCommentHighlight = computed(() => {
        const ids = new Set(this.changedCommentIds());
        if (ids.size === 0) {
            return false;
        }
        return (this.poll()?.comments ?? []).some(
            (c) => ids.has(c.id) && !c.optionId,
        );
    });

    pollId = input('');

    /** Set (via ?created=1) when arriving straight after poll creation. */
    created = input<string | undefined>(undefined);

    showAddOption = signal(false);

    /** Vote overlay state. */
    readonly voteOpen = signal(false);
    readonly voteStartOptionId = signal<string | undefined>(undefined);
    readonly voteRevote = signal(false);

    /** Share-link bar shown once, right after the poll was created. */
    readonly showShareBar = signal(false);
    readonly shareLink = computed(
        () => `${environment.baseUrl}/p/${this.project()?.id}`,
    );

    /**
     * Sub-type/time config for the add-option panel. Date polls share one
     * config across all options: the sub-type and whether options carry a
     * time-of-day both come from the poll's concrete OptionType.
     */
    readonly addPanelDateType = computed<DateOptionType | undefined>(() =>
        optionTypeToDateType(this.poll()?.optionType),
    );

    readonly addPanelShowTime = computed(() =>
        optionTypeHasTime(this.poll()?.optionType),
    );

    poll = this.projectDetailStore.currentPoll;
    project = this.projectDetailStore.currentProject;

    readonly optionAdding = this.projectDetailStore.optionAdding;
    readonly commentAdding = this.projectDetailStore.commentAdding;

    showShareDrawer = signal(false);

    private readonly sharePollLabel = this.translateService.translate(
        'project.share.pollLabel',
    );
    readonly shareDrawerTitle = this.translateService.translate(
        'project.share.title',
    );
    readonly shareDrawerSubtitle = computed(
        () => `${this.sharePollLabel()} · ${this.poll()?.name ?? ''}`,
    );

    showComments = signal(true);

    /** Poll-level comments drawer (mobile only). */
    showMobileComments = signal(false);

    /** Option whose comment drawer is currently open, if any. */
    commentsOption = signal<OptionDetail | undefined>(undefined);

    readonly commentsOptionTitle = computed(() => {
        const option = this.commentsOption();
        return option ? this.optionLabel(option.text) : '';
    });

    /** Display label for an option's raw text — date polls store a positional encoding. */
    private optionLabel(text: string): string {
        const dateType = optionTypeToDateType(this.poll()?.optionType);
        return dateType
            ? this.dateFormat.labelFromEntry(
                  this.dateFormat.parse(text, dateType),
              )
            : text;
    }

    readonly optionComments = computed(() => {
        const option = this.commentsOption();
        if (!option) {
            return [];
        }
        return (
            this.poll()?.comments.filter((c) => c.optionId === option.id) ?? []
        );
    });

    sortMode = signal<SortMode>('top');

    private readonly sortByApproval = this.translateService.translate(
        'project.results.sortByApproval',
    );
    private readonly sortByOrder = this.translateService.translate(
        'project.results.sortByOrder',
    );
    readonly sortLabel = computed(() =>
        this.sortMode() === 'top' ? this.sortByApproval() : this.sortByOrder(),
    );

    toggleSort() {
        const next: SortMode = this.sortMode() === 'top' ? 'original' : 'top';
        this.sortMode.set(next);
        this.persistSortMode(next);
    }

    /** Per-poll sort choice, remembered across visits. */
    private sortStorageKey(pollId: string): string {
        return `${POLL_SORT_STORAGE_PREFIX}${pollId}`;
    }

    private persistSortMode(mode: SortMode): void {
        const id = this.pollId();
        if (id) {
            localStorage.setItem(this.sortStorageKey(id), mode);
        }
    }

    canManagePoll = computed(() => {
        const project = this.project();
        const poll = this.poll();
        return (
            project !== undefined &&
            poll !== undefined &&
            project.role >= PollRole.Maintainer
        );
    });

    private readonly typeYesNo = this.translateService.translate(
        'project.results.type.yesno',
    );
    private readonly typeRating = this.translateService.translate(
        'project.results.type.rating',
    );
    private readonly typeDate = this.translateService.translate(
        'project.results.type.date',
    );
    readonly typeLabel = computed(() => {
        const optionType = this.poll()?.optionType;
        if (optionType === OptionType.Rating) {
            return this.typeRating();
        }
        if (isDateOptionType(optionType)) {
            return this.typeDate();
        }
        return this.typeYesNo();
    });

    private readonly statusActive = this.translateService.translate(
        'project.results.status.active',
    );
    private readonly statusClosed = this.translateService.translate(
        'project.results.status.closed',
    );
    readonly statusLabel = computed(() =>
        this.poll()?.isClosed ? this.statusClosed() : this.statusActive(),
    );

    readonly closeDateText = computed(() => {
        const closeDate = this.poll()?.closeDate;
        return closeDate ? this.dateFormat.formatCloseDate(closeDate) : '';
    });

    constructor() {
        const titleService = inject(TitleBarService);

        effect(() => {
            this.projectDetailStore.getPoll(this.pollId());
        });

        // Restore the sort choice remembered for this poll (defaults to "top").
        effect(() => {
            const id = this.pollId();
            const stored = id
                ? localStorage.getItem(this.sortStorageKey(id))
                : null;
            untracked(() =>
                this.sortMode.set(stored === 'original' ? 'original' : 'top'),
            );
        });

        // Realtime presence + sync, keyed to the active poll. Join on entry, leave the
        // previous poll when navigating between polls, and re-baseline the sync token so the
        // first delta doesn't highlight everything.
        let joinedPollId: string | undefined;
        effect(() => {
            const id = this.pollId();
            untracked(() => {
                if (joinedPollId === id) {
                    return;
                }
                if (joinedPollId) {
                    this.realtime.leavePoll(joinedPollId);
                }
                this.projectDetailStore.resetRealtimeState();
                joinedPollId = id;
                if (id) {
                    this.realtime.joinPoll(id);
                    // Baseline: captures the sync token without highlighting.
                    this.projectDetailStore.mergeDelta(id);
                }
            });
        });

        // Someone else changed the poll → pull the delta. Debounced so a burst of pings
        // (e.g. multi-option edits) collapses into a single fetch.
        this.realtime.pollChanged$
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
            .subscribe((change) => {
                const id = this.pollId();
                if (id) {
                    this.projectDetailStore.mergeDelta(id);
                    this.notifyActiveUpdate(change);
                }
            });

        this.destroyRef.onDestroy(() => {
            if (joinedPollId) {
                this.realtime.leavePoll(joinedPollId);
            }
            this.projectDetailStore.resetRealtimeState();
        });

        effect(() => {
            const poll = this.poll();
            if (poll) {
                titleService.setTitle(poll.name);
            }
        });

        effect(() => {
            const project = this.project();
            if (project) {
                titleService.setBackRoute('/polls');
            }
        });

        // Reveal the share-link bar once when the user lands here right after
        // creating the poll (?created=1). Only auto-opens a single time so a
        // manual dismiss sticks.
        let shareBarShown = false;
        effect(() => {
            if (!shareBarShown && this.created() && this.project()) {
                shareBarShown = true;
                this.showShareBar.set(true);
            }
        });
    }

    /** Toolbar entry: revote through every option. */
    startVote() {
        this.voteStartOptionId.set(undefined);
        this.voteRevote.set(true);
        this.voteOpen.set(true);
    }

    /** Option-card entry: start voting at a specific option. */
    openVoteAt(request: { optionId: string; revote: boolean }) {
        this.voteStartOptionId.set(request.optionId);
        this.voteRevote.set(request.revote);
        this.voteOpen.set(true);
    }

    closeVote() {
        this.voteOpen.set(false);
        // Refresh so option tallies reflect the votes just cast — the store's
        // vote() only patches the user's own choice, not the aggregate votes.
        this.projectDetailStore.getPoll(this.pollId());
    }

    addComment(content: string) {
        this.projectDetailStore.addComment({ pollId: this.pollId(), content });
    }

    openOptionComments(option: OptionDetail) {
        this.commentsOption.set(option);
    }

    saveOptionEdit(edit: {
        optionId: string;
        text: string;
        description: string;
    }) {
        this.projectDetailStore.updateOption(edit);
    }

    /** Edit-guard: defer remote changes to an option while the user edits it. */
    onEditStart(event: { optionId: string }) {
        this.projectDetailStore.startEditingOption(event.optionId);
    }

    onEditEnd(event: { optionId: string }) {
        this.projectDetailStore.stopEditingOption(event.optionId);
    }

    deleteOption(request: { optionId: string }) {
        this.projectDetailStore.deleteOption(request);
    }

    addOptionComment(content: string) {
        const option = this.commentsOption();
        if (!option) {
            return;
        }
        this.projectDetailStore.addComment({
            pollId: this.pollId(),
            content,
            optionId: option.id,
        });
    }

    onAddOption(payload: NewOptionPayload) {
        // Adding a card takes the spotlight — clear any lingering flashes on cards changed
        // moments earlier so only the new one draws attention.
        this.projectDetailStore.clearOptionHighlights();
        this.projectDetailStore.addOption({
            pollId: this.pollId(),
            text: payload.text,
            description: payload.description,
            meta: payload.meta,
            creator: {
                name: this.userStore.user()?.name ?? '',
                picture: '',
            },
        });
    }

    closePoll() {
        this.projectDetailStore.closePoll(this.pollId());
    }

    reopenPoll() {
        this.projectDetailStore.reopenPoll(this.pollId());
    }

    savePollDetails(details: { name: string; description: string }) {
        this.projectDetailStore.updatePollDetails({
            pollId: this.pollId(),
            name: details.name,
            description: details.description,
        });
    }

    deletePoll() {
        const projectId = this.project()?.id;
        if (!projectId) {
            return;
        }
        this.projectDetailStore.deleteProject(projectId);
    }

    sharePoll() {
        this.showShareDrawer.set(true);
    }

    /**
     * A collaborator changed the poll while the user is here. If the tab is in the foreground
     * (i.e. the user is not idle) we surface an in-app toast instead of leaning on the async
     * e-mail/notification, which the server suppresses for actively-present users anyway. A
     * backgrounded tab counts as idle, so we stay quiet and let the normal notification handle it.
     */
    private notifyActiveUpdate(change: PollChangedNotification) {
        if (typeof document !== 'undefined' && document.hidden) {
            return;
        }
        // Votes are the most frequent change and already show live on the option cards, so a
        // toast per vote would just be noise on a busy poll.
        if (change.change?.kind === 'voteCast') {
            return;
        }
        const actorName = this.presence().find(
            (p) => p.userId === change.actorUserId,
        )?.name;
        const message = this.buildUpdateMessage(actorName, change.change);
        // `toast-update` is a global class (src/styles.css) that renders this live-update
        // toast as a dark pill. Per-toast `style` is not honoured by this sonner build, and
        // the global toast rule uses !important — so styling has to go through a class.
        toast(message, { class: 'toast-update' });
    }

    /**
     * Compose the toast copy from the change descriptor: a specific line per change kind
     * ("added an option", "renamed the poll", …), falling back to a generic message when the
     * actor is unknown or the kind isn't recognised.
     */
    private buildUpdateMessage(
        actorName: string | undefined,
        change: PollChangeInfo | undefined,
    ): string {
        if (!actorName) {
            return this.translateService.instant(
                'project.results.updateToast.genericNoName',
            );
        }
        const key = change?.kind
            ? `project.results.updateToast.${change.kind}`
            : 'project.results.updateToast.generic';
        const target = change?.target ?? '';
        const message = this.translateService.instant(key, {
            name: actorName,
            target: OPTION_TARGET_KINDS.has(change?.kind ?? '')
                ? this.optionLabel(target)
                : target,
        });
        // ngx-translate echoes the key back when it's missing — fall back to the generic line
        // so an unknown/new kind never shows a raw translation key.
        return message === key
            ? this.translateService.instant(
                  'project.results.updateToast.generic',
                  {
                      name: actorName,
                  },
              )
            : message;
    }
}
