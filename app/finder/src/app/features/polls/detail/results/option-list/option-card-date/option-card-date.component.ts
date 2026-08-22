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
import { DsProgressBarComponent } from '@ds/progress-bar/ds-progress-bar.component';
import { AvatarStackComponent, AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { OptionDetail } from '../../../../_shared/models/poll-detail.model';
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
  imports: [RouterLink, DsButtonComponent, DsProgressBarComponent, AvatarStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  private readonly dateFormatService = inject(DateOptionFormatService);

  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');
  hideResults = input(false);
  rank = input(0);

  expanded = signal(false);

  private readonly parsed = computed(() =>
    this.dateFormatService.parse(this.option().text),
  );

  readonly label = computed(() => this.dateFormatService.labelFromEntry(this.parsed()));
  readonly subLabel = computed(() => this.dateFormatService.subLabelFromEntry(this.parsed()));

  readonly yesVotes = computed(() =>
    this.option().votes.filter(v => v.choice === '1'),
  );

  readonly noVotes = computed(() =>
    this.option().votes.filter(v => v.choice === '2'),
  );

  readonly totalVoters = computed(() => this.option().votes.length);

  readonly yesPercent = computed(() => {
    const total = this.totalVoters();
    return total > 0 ? Math.round((this.yesVotes().length / total) * 100) : 0;
  });

  readonly voteLine = computed(() => {
    const yes = this.yesVotes().length;
    const no = this.noVotes().length;
    const parts: string[] = [];
    if (yes) { parts.push(`${yes} × kann`); }
    if (no)  { parts.push(`${no} × kann nicht`); }
    return parts.join(' · ') || 'Keine Stimmen';
  });

  readonly avatarUsers = computed((): AvatarUser[] =>
    this.yesVotes().map(v => ({ name: v.person })),
  );

  readonly groups = computed((): VoteGroup[] => {
    const groups: VoteGroup[] = [];
    const yes = this.yesVotes();
    const no  = this.noVotes();
    if (yes.length) {
      groups.push({
        label: 'Kann',
        bg: 'var(--positive-tint, #e2ede1)',
        fg: 'var(--positive)',
        names: yes.map(v => v.person).join(', '),
      });
    }
    if (no.length) {
      groups.push({
        label: 'Kann nicht',
        bg: '#fdf3f1',
        fg: 'var(--negative)',
        names: no.map(v => v.person).join(', '),
      });
    }
    return groups;
  });
}
