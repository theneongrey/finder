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
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionListComponent } from './option-list/option-list.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';
import { ResultsToolbarComponent } from './results-toolbar/results-toolbar.component';
import { PollHeaderComponent } from './poll-header/poll-header.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { PollRole } from '../../_shared/models/poll-role.enum';
import { OptionType } from '@common/models/option-type.model';
import { ShareDrawerComponent } from '@ds/share-drawer/share-drawer.component';
import { ShareContentComponent } from '../../_shared/ui/share-content/share-content.component';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    imports: [
        TranslatePipe,
        OptionListComponent,
        CommentsSectionComponent,
        ResultsToolbarComponent,
        PollHeaderComponent,
        ShareDrawerComponent,
        ShareContentComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
    private readonly projectDetailStore = inject(PollDetailStore);
    private readonly translateService = inject(TranslateService);

    readonly OptionType = OptionType;

    pollId = input('');

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
        const poll = this.poll();
        if (!poll?.closeDate) {
            return '';
        }
        const locale = this.translateService.currentLang() || 'de';
        const d = new Date(poll.closeDate);
        const date = d.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
        const time = d.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${date}, ${time}`;
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

    addComment(content: string) {
        this.projectDetailStore.addComment({ pollId: this.pollId(), content });
    }

    closePoll() {
        this.projectDetailStore.closePoll(this.pollId());
    }

    reopenPoll() {
        this.projectDetailStore.reopenPoll(this.pollId());
    }

    editPoll() {
        // TODO: wire up poll editing once the edit flow exists.
    }

    sharePoll() {
        this.showShareDrawer.set(true);
    }
}
