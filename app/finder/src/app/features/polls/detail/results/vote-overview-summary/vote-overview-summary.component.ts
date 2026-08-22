import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsProgressBarComponent } from '@ds/progress-bar/ds-progress-bar.component';
import { AvatarStackComponent, AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail, OptionType, PollDetail } from '../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../_shared/utils/date-option-format.service';

@Component({
  selector: 'app-vote-overview-summary',
  templateUrl: './vote-overview-summary.component.html',
  imports: [DsCardComponent, DsProgressBarComponent, AvatarStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteOverviewSummaryComponent {
  private readonly dateFormatService = inject(DateOptionFormatService);

  poll = input.required<PollDetail>();
  commentsCount = input(0);

  private readonly winner = computed(() => {
    const options = this.poll().options;
    if (!options.length) { return undefined; }
    const type = this.poll().optionType;
    return options.slice().sort((a, b) =>
      type === OptionType.Rating
        ? this.avgRating(b) - this.avgRating(a)
        : this.yesCount(b) - this.yesCount(a),
    )[0];
  });

  readonly heroLabel = computed(() => {
    const w = this.winner();
    if (!w) { return ''; }
    const type = this.poll().optionType;
    if (type === OptionType.Date) {
      return this.dateFormatService.formatLabel(w.text);
    }
    return w.text;
  });

  readonly badge = computed(() => {
    switch (this.poll().optionType) {
      case OptionType.Rating: return 'Beste Bewertung';
      case OptionType.Date:   return 'Bester Termin';
      default:                return 'Führt';
    }
  });

  readonly badgeIsPositive = computed(() => this.poll().optionType !== OptionType.Rating);

  readonly bigMetric = computed(() => {
    const w = this.winner();
    if (!w) { return '0'; }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const avg = this.avgRating(w);
      return avg > 0 ? avg.toFixed(1).replace('.', ',') : '—';
    }
    const total = this.uniqueVoters().size;
    if (!total) { return '0 %'; }
    return Math.round((this.yesCount(w) / total) * 100) + ' %';
  });

  readonly metricSmall = computed(() => {
    const w = this.winner();
    if (!w) { return ''; }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const count = w.votes.filter(v => v.choice && parseInt(v.choice) > 0).length;
      return `von 5 Sternen · ${count} Bewertungen`;
    }
    const yes = this.yesCount(w);
    const total = this.uniqueVoters().size;
    return `${yes} von ${total} dafür`;
  });

  readonly metricColor = computed(() =>
    this.poll().optionType === OptionType.Rating ? 'var(--warning)' : 'var(--positive)',
  );

  readonly progressPercent = computed(() => {
    const w = this.winner();
    if (!w) { return 0; }
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      const avg = this.avgRating(w);
      return Math.round((avg / 5) * 100);
    }
    const total = this.uniqueVoters().size;
    if (!total) { return 0; }
    return Math.round((this.yesCount(w) / total) * 100);
  });

  readonly avatarUsers = computed((): AvatarUser[] => {
    const w = this.winner();
    if (!w) { return []; }
    const type = this.poll().optionType;
    let voters: string[];
    if (type === OptionType.Rating) {
      const maxRating = Math.max(...w.votes.map(v => parseInt(v.choice ?? '0')));
      voters = w.votes
        .filter(v => parseInt(v.choice ?? '0') === maxRating)
        .map(v => v.person);
    } else {
      voters = w.votes.filter(v => v.choice === '1').map(v => v.person);
    }
    return voters.map(name => ({ name }));
  });

  readonly stats = computed(() => {
    const poll = this.poll();
    const voters = this.uniqueVoters().size;
    const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
    return [
      { label: 'Teilnehmer', value: voters },
      { label: 'Stimmen', value: totalVotes },
      { label: 'Kommentare', value: this.commentsCount() },
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
    return option.votes.filter(v => v.choice === '1').length;
  }

  private avgRating(option: OptionDetail): number {
    const rated = option.votes.filter(v => v.choice && !isNaN(parseInt(v.choice)));
    if (!rated.length) { return 0; }
    return rated.reduce((s, v) => s + parseInt(v.choice!), 0) / rated.length;
  }
}
