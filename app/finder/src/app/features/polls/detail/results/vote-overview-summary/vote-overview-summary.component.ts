import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import {
  AvatarStackComponent,
  AvatarUser,
} from '@smart/avatar-stack/avatar-stack.component';
import {
  OptionDetail,
  OptionType,
  PollDetail,
} from '../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../_shared/utils/date-option-format.service';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  color: string;
}

@Component({
  selector: 'app-vote-overview-summary',
  templateUrl: './vote-overview-summary.component.html',
  imports: [DsCardComponent, AvatarStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteOverviewSummaryComponent {
  private readonly dateFormatService = inject(DateOptionFormatService);

  poll = input.required<PollDetail>();
  commentsCount = input(0);
  commentsWithContext = input(0);
  totalMembers = input(0);

  private readonly winner = computed(() => {
    const options = this.poll().options;
    if (!options.length) {
      return undefined;
    }
    const type = this.poll().optionType;
    return options
      .slice()
      .sort((a, b) =>
        type === OptionType.Rating
          ? this.avgRating(b) - this.avgRating(a)
          : this.yesCount(b) - this.yesCount(a),
      )[0];
  });

  readonly heroLabel = computed(() => {
    const w = this.winner();
    if (!w) {
      return '';
    }
    const type = this.poll().optionType;
    if (type === OptionType.Date) {
      return this.dateFormatService.formatLabel(w.text);
    }
    return w.text;
  });

  readonly badge = computed(() => {
    switch (this.poll().optionType) {
      case OptionType.Rating:
        return 'Beste Bewertung';
      case OptionType.Date:
        return 'Bester Termin';
      default:
        return 'Führt';
    }
  });

  readonly badgeIsPositive = computed(
    () => this.poll().optionType !== OptionType.Rating,
  );

  readonly bigMetric = computed(() => {
    const w = this.winner();
    if (!w) {
      return '0';
    }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const avg = this.avgRating(w);
      return avg > 0 ? avg.toFixed(1).replace('.', ',') : '—';
    }
    const total = this.uniqueVoters().size;
    if (!total) {
      return '0 %';
    }
    return Math.round((this.yesCount(w) / total) * 100) + ' %';
  });

  readonly metricSmall = computed(() => {
    const w = this.winner();
    if (!w) {
      return '';
    }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const count = w.votes.filter(
        (v) => v.choice && parseInt(v.choice) > 0,
      ).length;
      return `von 5 Sternen · ${count} Bewertungen`;
    }
    const yes = this.yesCount(w);
    const total = this.uniqueVoters().size;
    return `${yes} von ${total} ${type === OptionType.Date ? 'können' : 'dafür'}`;
  });

  readonly metricColor = computed(() =>
    this.poll().optionType === OptionType.Rating ? '#c98f2c' : '#5d9a56',
  );

  readonly peopleLine = computed(() => {
    const w = this.winner();
    if (!w) {
      return '';
    }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const maxRating = Math.max(
        ...w.votes.map((v) => parseInt(v.choice ?? '0')),
        0,
      );
      const topNames = w.votes
        .filter((v) => parseInt(v.choice ?? '0') === maxRating)
        .map((v) => v.person)
        .join(', ');
      return `Am höchsten bewertet von ${topNames}`;
    }
    const maybe = w.votes.filter((v) => v.choice === '3').length;
    const no = w.votes.filter((v) => v.choice === '2').length;
    if (maybe) {
      return `${maybe} × vielleicht, ${no} × nein`;
    }
    return `${no} × dagegen`;
  });

  readonly avatarUsers = computed((): AvatarUser[] => {
    const w = this.winner();
    if (!w) {
      return [];
    }
    const type = this.poll().optionType;
    let voters: string[];
    if (type === OptionType.Rating) {
      const maxRating = Math.max(
        ...w.votes.map((v) => parseInt(v.choice ?? '0')),
      );
      voters = w.votes
        .filter((v) => parseInt(v.choice ?? '0') === maxRating)
        .map((v) => v.person);
    } else {
      voters = w.votes.filter((v) => v.choice === '1').map((v) => v.person);
    }
    return voters.map((name) => ({ name }));
  });

  readonly typeLabel = computed(() => {
    switch (this.poll().optionType) {
      case OptionType.Rating:
        return 'Bewertung';
      case OptionType.Date:
        return 'Terminumfrage';
      default:
        return 'Ja / Nein';
    }
  });

  readonly statusLabel = computed(() =>
    this.poll().isClosed ? 'Beendet' : 'Aktiv',
  );
  readonly statusBg = computed(() =>
    this.poll().isClosed ? '#f1eee9' : '#e2ede1',
  );
  readonly statusFg = computed(() =>
    this.poll().isClosed ? '#6f6b66' : '#3f7a4e',
  );
  readonly statusDot = computed(() =>
    this.poll().isClosed ? '#b5b0a8' : '#5d9a56',
  );
  readonly statusPulse = computed(() => !this.poll().isClosed);

  readonly deadlineText = computed(() => {
    const poll = this.poll();
    if (poll.isClosed) {
      return 'Beendet';
    }
    if (!poll.closeDate) {
      return 'Läuft';
    }
    const d = new Date(poll.closeDate);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Endet heute';
    }
    if (diffDays === 1) {
      return 'Endet morgen';
    }
    if (diffDays <= 7) {
      return `Endet in ${diffDays} Tagen`;
    }
    return `Endet am ${d.toLocaleDateString('de', { day: 'numeric', month: 'short' })}`;
  });

  readonly stats = computed((): StatCard[] => {
    const poll = this.poll();
    const type = poll.optionType;
    const voters = this.uniqueVoters().size;
    const winner = this.winner();
    const winnerYesPct =
      winner && this.uniqueVoters().size
        ? Math.round((this.yesCount(winner) / this.uniqueVoters().size) * 100)
        : 0;
    const overallAvg =
      type === OptionType.Rating
        ? poll.options.reduce((s, o) => s + this.avgRating(o), 0) /
          (poll.options.length || 1)
        : 0;

    return [
      {
        label: 'Beteiligung',
        value: this.totalMembers() ? `${voters}/${this.totalMembers()}` : String(voters),
        sub: 'haben abgestimmt',
        color: '#1f7a8c',
      },
      {
        label: type === OptionType.Rating ? 'Schnitt gesamt' : 'Klarer Favorit',
        value:
          type === OptionType.Rating
            ? overallAvg.toFixed(1).replace('.', ',')
            : winnerYesPct + ' %',
        sub: type === OptionType.Rating ? 'von 5' : 'Zustimmung',
        color: type === OptionType.Rating ? '#c98f2c' : '#3f7a4e',
      },
      {
        label: 'Kommentare',
        value: String(this.commentsCount()),
        sub: `${this.commentsWithContext()} beim Abstimmen`,
        color: '#a8742a',
      },
    ];
  });

  private readonly uniqueVoters = computed(() => {
    const names = new Set<string>();
    for (const opt of this.poll().options) {
      for (const v of opt.votes) {
        names.add(v.person);
      }
    }
    return names;
  });

  private yesCount(option: OptionDetail): number {
    return option.votes.filter((v) => v.choice === '1').length;
  }

  private avgRating(option: OptionDetail): number {
    const rated = option.votes.filter(
      (v) => v.choice && !isNaN(parseInt(v.choice)),
    );
    if (!rated.length) {
      return 0;
    }
    return rated.reduce((s, v) => s + parseInt(v.choice!), 0) / rated.length;
  }
}
