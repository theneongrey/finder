import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { POLL_LIMITS } from '../../../../_shared/models/poll-limits';
import {
    ResultsProgressBarComponent,
    ProgressSegment,
} from '../results-progress-bar/results-progress-bar.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import {
    AvatarStackComponent,
    AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';
import * as voteTally from '../../../../_shared/utils/vote-tally.utils';

@Component({
    selector: 'app-option-card',
    templateUrl: './option-card.component.html',
    imports: [
        FormsModule,
        RouterLink,
        TranslatePipe,
        DsButtonComponent,
        DsCardComponent,
        DsInputComponent,
        DsTextareaComponent,
        ResultsProgressBarComponent,
        AvatarStackComponent,
        UserAvatarComponent,
        DsIconComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
    private readonly translate = inject(TranslateService);

    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    commentCount = input(0);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);
    pollType = input<'yesno' | 'rating'>('yesno');

    commentsClick = output<void>();
    saveEdit = output<{
        optionId: string;
        text: string;
        description: string;
    }>();
    deleteOption = output<{ optionId: string }>();

    protected readonly limits = POLL_LIMITS;

    protected readonly editing = signal(false);
    protected readonly deleteConfirm = signal(false);
    protected readonly editText = signal('');
    protected readonly editDescription = signal('');

    protected startEdit(): void {
        this.deleteConfirm.set(false);
        this.editText.set(this.option().text);
        this.editDescription.set(this.option().description ?? '');
        this.editing.set(true);
    }

    protected cancelEdit(): void {
        this.editing.set(false);
    }

    protected confirmDelete(): void {
        this.deleteOption.emit({ optionId: this.option().id });
        this.deleteConfirm.set(false);
        this.editing.set(false);
    }

    protected submitEdit(): void {
        const text = this.editText().trim();
        if (!text) {
            return;
        }
        this.saveEdit.emit({
            optionId: this.option().id,
            text,
            description: this.editDescription().trim(),
        });
        this.editing.set(false);
    }

    /** Option carries only its title — no description, image or link. */
    readonly isTextOnly = computed(() => {
        const o = this.option();
        return !o.description && !o.meta?.imageUrl && !o.meta?.url;
    });

    // ── Yes/No ──────────────────────────────────────────────────────
    readonly yesVotes = computed(() => voteTally.yesVotes(this.option()));

    readonly noVotes = computed(() => voteTally.noVotes(this.option()));

    readonly totalVoters = computed(() => voteTally.totalVoters(this.option()));

    // ── Participation (shared with overview card) ───────────────────
    readonly totalParticipants = computed(() => {
        const members = this.members().length;
        return members > 0 ? members : this.option().votes.length;
    });

    readonly votedCount = computed(() =>
        this.pollType() === 'rating' ? this.ratingsCount() : this.totalVoters(),
    );

    readonly votedPercent = computed(() => {
        const total = this.totalParticipants();
        return total > 0 ? Math.round((this.votedCount() / total) * 100) : 0;
    });

    // ── Rating ──────────────────────────────────────────────────────
    readonly averageRating = computed(() =>
        voteTally.averageRating(this.option()),
    );

    readonly ratingsCount = computed(() =>
        voteTally.ratingsCount(this.option()),
    );

    readonly avgLabel = computed(() => {
        const avg = this.averageRating();
        return avg > 0 ? avg.toFixed(1).replace('.', ',') : '—';
    });

    // ── Shared / switched ───────────────────────────────────────────
    readonly segments = computed((): ProgressSegment[] => {
        if (this.pollType() === 'rating') {
            return [
                {
                    percent: Math.round((this.averageRating() / 5) * 100),
                    color: 'var(--star)',
                },
            ];
        }
        const total = this.totalVoters();
        if (!total) {
            return [];
        }
        return [
            {
                percent: (this.yesVotes().length / total) * 100,
                color: 'var(--positive-strong)',
            },
            {
                percent: (this.noVotes().length / total) * 100,
                color: 'var(--negative-soft)',
            },
        ].filter((s) => s.percent > 0);
    });

    readonly voteLine = computed(() => {
        if (this.pollType() === 'rating') {
            const count = this.ratingsCount();
            if (!count) {
                return this.translate.instant('project.results.noRatings');
            }
            return this.translate.instant('project.results.ratingSummary', {
                count,
                avg: this.averageRating().toFixed(1).replace('.', ','),
            });
        }
        const yes = this.yesVotes().length;
        const no = this.noVotes().length;
        if (!yes && !no) {
            return this.translate.instant('project.results.noVotes');
        }
        return this.translate.instant('project.results.voteLineYesNo', {
            yes,
            no,
        });
    });

    readonly avatarUsers = computed((): AvatarUser[] =>
        voteTally.avatarUsers(this.option(), this.members()),
    );

    protected openUrl(url: string) {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
