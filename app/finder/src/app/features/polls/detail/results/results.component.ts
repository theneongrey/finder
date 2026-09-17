import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslateService } from '@ngx-translate/core';
import { OptionListComponent } from './option-list/option-list.component';
import { ResultsSkeletonComponent } from './results-skeleton/results-skeleton.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';
import { ResultsToolbarComponent } from './results-toolbar/results-toolbar.component';
import { PollHeaderComponent } from './poll-header/poll-header.component';
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
import { DateOptionFormatService } from '../../_shared/utils/date-option-format.service';
import { DateOptionType } from '../../_shared/models/date-option.model';
import { OptionDetail } from '../../_shared/models/poll-detail.model';
import { UserStore } from '@common/data/user.store';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrl: './results.component.css',
    imports: [
        OptionListComponent,
        ResultsSkeletonComponent,
        CommentsSectionComponent,
        ResultsToolbarComponent,
        PollHeaderComponent,
        ShareDrawerComponent,
        DsSideDrawerComponent,
        ShareContentComponent,
        AddOptionPanelComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly translateService = inject(TranslateService);
    private readonly router = inject(Router);
    private readonly dateFormat = inject(DateOptionFormatService);
    private readonly userStore = inject(UserStore);

    readonly OptionType = OptionType;

    pollId = input('');

    showAddOption = signal(false);

    /**
     * Sub-type/time config for the add-option panel. Date polls share one
     * config across all options, so the first option is enough — no need to
     * re-parse the whole list.
     */
    private readonly addPanelFirstEntry = computed(() => {
        const poll = this.poll();
        const first = poll?.options[0];
        if (!first || poll?.optionType !== OptionType.Date) {
            return undefined;
        }
        return this.dateFormat.parse(first.text);
    });

    readonly addPanelDateType = computed<DateOptionType | undefined>(() => {
        if (this.poll()?.optionType !== OptionType.Date) {
            return undefined;
        }
        return this.addPanelFirstEntry()?.type ?? 'date';
    });

    readonly addPanelShowTime = computed(
        () => this.addPanelFirstEntry()?.startTime !== undefined,
    );

    poll = this.projectDetailStore.currentPoll;
    project = this.projectDetailStore.currentProject;

    showShareDrawer = signal(false);

    private readonly sharePollLabel = this.translateService.translate(
        'project.share.pollLabel',
    );
    readonly shareDrawerTitle = this.translateService.translate(
        'project.share.title',
    );
    private readonly shareActionLabel = this.translateService.translate(
        'project.common.share',
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
        if (this.poll()?.optionType === OptionType.Date) {
            return this.dateFormat.labelFromEntry(
                this.dateFormat.parse(option.text),
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
        switch (this.poll()?.optionType) {
            case OptionType.Rating:
                return this.typeRating();
            case OptionType.Date:
                return this.typeDate();
            default:
                return this.typeYesNo();
        }
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

        // Expose "Teilen" in the title bar while the poll is open
        effect(() => {
            const poll = this.poll();
            if (poll && !poll.isClosed) {
                titleService.setAction({
                    icon: 'share',
                    label: this.shareActionLabel(),
                    handler: () => this.sharePoll(),
                });
            } else {
                titleService.clearAction();
            }
        });

        inject(DestroyRef).onDestroy(() => titleService.clearAction());

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
    }

    startVote() {
        const projectId = this.project()?.id;
        if (!projectId) {
            return;
        }
        this.router.navigate(['/polls', projectId, 'vote', this.pollId()], {
            queryParams: { revote: 1 },
        });
    }

    addComment(content: string) {
        this.projectDetailStore.addComment({ pollId: this.pollId(), content });
    }

    openOptionComments(option: OptionDetail) {
        this.commentsOption.set(option);
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
        this.projectDetailStore.deletePoll(this.pollId());
    }

    sharePoll() {
        this.showShareDrawer.set(true);
    }

    refresh() {
        this.projectDetailStore.getPoll(this.pollId());
    }
}
