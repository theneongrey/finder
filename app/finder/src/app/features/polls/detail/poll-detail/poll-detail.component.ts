import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
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

    readonly OptionType = OptionType;

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

    readonly refreshing = this.projectDetailStore.pollRefreshing;
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
        if (!option) {
            return '';
        }
        const dateType = optionTypeToDateType(this.poll()?.optionType);
        if (dateType) {
            return this.dateFormat.labelFromEntry(
                this.dateFormat.parse(option.text, dateType),
            );
        }
        return option.text;
    });

    readonly optionComments = computed(() => {
        const option = this.commentsOption();
        if (!option) {
            return [];
        }
        return (
            this.poll()?.comments.filter((c) => c.optionId === option.id) ?? []
        );
    });

    sortMode = signal<'top' | 'original'>('top');

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
        this.sortMode.update((s) => (s === 'top' ? 'original' : 'top'));
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

    refresh() {
        this.projectDetailStore.getPoll(this.pollId());
    }
}
