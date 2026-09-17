import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
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
        RouterLink,
        DsButtonComponent,
        DsCardComponent,
        ResultsProgressBarComponent,
        AvatarStackComponent,
        UserAvatarComponent,
        DsIconComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    commentCount = input(0);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);
    pollType = input<'yesno' | 'rating'>('yesno');

    commentsClick = output<void>();

    /** Option carries only its title — no description, image or link. */
    readonly isTextOnly = computed(() => {
        const o = this.option();
        return !o.description && !o.meta?.imageUrl && !o.meta?.url;
    });

    // ── Yes/No ──────────────────────────────────────────────────────
    readonly yesVotes = computed(() => voteTally.yesVotes(this.option()));

    readonly noVotes = computed(() => voteTally.noVotes(this.option()));

    readonly totalVoters = computed(() => voteTally.totalVoters(this.option()));

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
                color: '#e3a7a2',
            },
        ].filter((s) => s.percent > 0);
    });

    readonly voteLine = computed(() => {
        if (this.pollType() === 'rating') {
            const count = this.ratingsCount();
            if (!count) {
                return 'Keine Bewertungen';
            }
            return `${count} Bewertungen · Ø ${this.averageRating().toFixed(1).replace('.', ',')} von 5`;
        }
        const yes = this.yesVotes().length;
        const no = this.noVotes().length;
        if (!yes && !no) {
            return 'Keine Stimmen';
        }
        return `${yes} × Ja · ${no} × Nein`;
    });

    readonly avatarUsers = computed((): AvatarUser[] =>
        voteTally.avatarUsers(this.option(), this.members()),
    );

    protected openUrl(url: string) {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
