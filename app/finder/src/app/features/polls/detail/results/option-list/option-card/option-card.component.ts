import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    signal,
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
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';

interface VoteGroup {
    label: string;
    bg: string;
    fg: string;
    names: string;
}

@Component({
    selector: 'app-option-card',
    templateUrl: './option-card.component.html',
    imports: [
        RouterLink,
        DsButtonComponent,
        ResultsProgressBarComponent,
        AvatarStackComponent,
        DsIconComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);
    rank = input(0);
    pollType = input<'yesno' | 'rating'>('yesno');

    expanded = signal(false);

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

    readonly yesPercent = computed(() => {
        const total = this.totalVoters();
        return total > 0
            ? Math.round((this.yesVotes().length / total) * 100)
            : 0;
    });

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

    readonly groups = computed((): VoteGroup[] => {
        const groups: VoteGroup[] = [];
        if (this.pollType() === 'rating') {
            for (let stars = 5; stars >= 1; stars--) {
                const voters = this.option().votes.filter(
                    (v) => parseInt(v.choice ?? '0') === stars,
                );
                if (!voters.length) {
                    continue;
                }
                groups.push({
                    label: `${stars} ★`,
                    bg: 'var(--star-bg)',
                    fg: 'var(--star-fg)',
                    names: voters.map((v) => v.person).join(', '),
                });
            }
        } else {
            const yes = this.yesVotes();
            const no = this.noVotes();
            if (yes.length) {
                groups.push({
                    label: 'Ja',
                    bg: '#e2ede1',
                    fg: '#3f7a4e',
                    names: yes.map((v) => v.person).join(', '),
                });
            }
            if (no.length) {
                groups.push({
                    label: 'Nein',
                    bg: '#fdf3f1',
                    fg: '#c1453f',
                    names: no.map((v) => v.person).join(', '),
                });
            }
        }
        const open = this.members().filter(
            (m) => !this.votedNames().has(m.name),
        );
        if (open.length) {
            groups.push({
                label: 'Offen',
                bg: '#f1eee9',
                fg: '#8a8681',
                names: open.map((m) => m.name).join(', '),
            });
        }
        return groups;
    });

    protected openUrl(url: string) {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
