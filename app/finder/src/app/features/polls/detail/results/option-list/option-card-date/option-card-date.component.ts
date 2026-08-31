import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
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
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';

interface VoteGroup {
    label: string;
    bg: string;
    fg: string;
    names: string;
}

@Component({
    selector: 'app-option-card-date',
    templateUrl: './option-card-date.component.html',
    imports: [
        RouterLink,
        DsButtonComponent,
        ResultsProgressBarComponent,
        AvatarStackComponent,
        DsIconComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
    private readonly dateFormatService = inject(DateOptionFormatService);

    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);
    rank = input(0);

    expanded = signal(false);

    private readonly parsed = computed(() =>
        this.dateFormatService.parse(this.option().text),
    );

    readonly label = computed(() =>
        this.dateFormatService.labelFromEntry(this.parsed()),
    );
    readonly subLabel = computed(() =>
        this.dateFormatService.subLabelFromEntry(this.parsed()),
    );

    readonly yesVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '1'),
    );

    readonly maybeVotes = computed(() =>
        this.option().votes.filter((v) => v.choice === '3'),
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

    readonly segments = computed((): ProgressSegment[] => {
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
                percent: (this.maybeVotes().length / total) * 100,
                color: '#e0b45c',
            },
            {
                percent: (this.noVotes().length / total) * 100,
                color: '#e3a7a2',
            },
        ].filter((s) => s.percent > 0);
    });

    readonly voteLine = computed(() => {
        const yes = this.yesVotes().length;
        const maybe = this.maybeVotes().length;
        const no = this.noVotes().length;
        if (!yes && !maybe && !no) {
            return 'Keine Stimmen';
        }
        const parts = [
            `${yes} × kann`,
            `${maybe} × vielleicht`,
            `${no} × kann nicht`,
        ];
        return parts.join(' · ');
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
        const yes = this.yesVotes();
        const maybe = this.maybeVotes();
        const no = this.noVotes();
        if (yes.length) {
            groups.push({
                label: 'Kann',
                bg: '#e2ede1',
                fg: '#3f7a4e',
                names: yes.map((v) => v.person).join(', '),
            });
        }
        if (maybe.length) {
            groups.push({
                label: 'Vielleicht',
                bg: '#f6e7cf',
                fg: '#a8742a',
                names: maybe.map((v) => v.person).join(', '),
            });
        }
        if (no.length) {
            groups.push({
                label: 'Kann nicht',
                bg: '#fdf3f1',
                fg: '#c1453f',
                names: no.map((v) => v.person).join(', '),
            });
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
}
