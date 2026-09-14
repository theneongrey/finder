import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsButtonComponent } from '@ds/button/ds-button.component';
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

@Component({
    selector: 'app-option-card',
    templateUrl: './option-card.component.html',
    imports: [
        RouterLink,
        DsButtonComponent,
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

    // ── Yes/No ──────────────────────────────────────────────────────
    readonly yesVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '1'),
    );

    readonly noVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '2'),
    );

    readonly totalVoters = computed(
        () =>
            this.option().votes.filter((v) => parseInt(v.choice ?? '0') > 0)
                .length,
    );

    // ── Rating ──────────────────────────────────────────────────────
    readonly averageRating = computed(() => {
        const rated = this.option().votes.filter(
            (v) =>
                v.choice &&
                !isNaN(parseInt(v.choice)) &&
                parseInt(v.choice) > 0,
        );
        if (!rated.length) {
            return 0;
        }
        return (
            rated.reduce((s, v) => s + parseInt(v.choice!), 0) / rated.length
        );
    });

    readonly ratingsCount = computed(
        () =>
            this.option().votes.filter(
                (v) =>
                    v.choice &&
                    !isNaN(parseInt(v.choice)) &&
                    parseInt(v.choice) > 0,
            ).length,
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

    readonly avatarUsers = computed((): AvatarUser[] => {
        const voted = this.votedNames();
        const members = this.members();
        if (members.length) {
            return members.map((m) => ({
                name: m.name,
                voted: voted.has(m.name),
            }));
        }
        return this.option().votes.map((v) => ({
            name: v.person,
            voted: parseInt(v.choice ?? '0') > 0,
        }));
    });

    private readonly votedNames = computed(
        () =>
            new Set(
                this.option()
                    .votes.filter((v) => parseInt(v.choice ?? '0') > 0)
                    .map((v) => v.person),
            ),
    );

    protected openUrl(url: string) {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
