import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionType } from '../../models/poll-detail.model';
import { PollItem } from '../../models/poll-item.model';
import { PollRole } from '../../models/poll-role.enum';
import { PollVotingStatus } from '../../models/standalone-poll-overview.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { PollTypeBadgeComponent } from '../poll-type-badge/poll-type-badge.component';
import { PollItemTimeComponent } from './poll-item-time.component';
import { PollItemProgressComponent } from './poll-item-progress.component';

export interface ParticipantAvatar {
  initial: string;
  bg: string;
  fg: string;
  voted: boolean;
}

@Component({
  selector: 'app-poll-item',
  host: {
    '(mouseenter)': 'isHovered.set(true)',
    '(mouseleave)': 'isHovered.set(false)',
  },
  imports: [
    RouterLink,
    TranslatePipe,
    DsCardComponent,
    DsButtonComponent,
    DsStatusDotComponent,
    PollTypeBadgeComponent,
    PollItemTimeComponent,
    PollItemProgressComponent,
  ],
  templateUrl: './poll-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  poll = input.required<PollItem>();
  editMode = input<boolean>(false);
  previewMode = input<boolean>(false);
  isHovered = signal(false);
  deletionRequested = output();
  shareRequested = output();
  favoriteToggled = output<string>();

  readonly showActions = computed(() => this.poll().role >= PollRole.Maintainer);
  readonly canShare    = computed(() => this.poll().role >= PollRole.Owner);

  readonly editRoute = computed(() => {
    const poll = this.poll();
    if (poll.optionType === OptionType.YesNo) {
      return ['/polls', poll.projectId, 'poll', 'edit', 'yesno', poll.pollId];
    }
    if (poll.optionType === OptionType.Rating) {
      return ['/polls', poll.projectId, 'poll', 'edit', 'rating', poll.pollId];
    }
    if (poll.optionType === OptionType.Date) {
      return ['/polls', poll.projectId, 'poll', 'edit', 'date', poll.pollId];
    }
    return null;
  });

  readonly ctaRoute = computed(() => {
    const poll = this.poll();
    if (!poll.currentUserVoted) {
      return ['/polls', poll.projectId, 'vote', poll.pollId, poll.nextOpenOptionId];
    }
    return ['/polls', poll.projectId, 'results', poll.pollId];
  });

  readonly ctaLabel = computed(() =>
    this.poll().currentUserVoted
      ? this.translateService.instant('project.detail.item.viewProgress')
      : this.translateService.instant('project.detail.item.voteNow'),
  );

  readonly progressPercent = computed(() => {
    const { votedCount, totalParticipants } = this.poll();
    return totalParticipants > 0 ? Math.round((votedCount / totalParticipants) * 100) : 0;
  });

  readonly participantAvatars = computed<ParticipantAvatar[]>(() =>
    this.poll().participants.map((p, i) => ({
      initial: p.name.charAt(0).toUpperCase(),
      bg: `var(--person-${(i % 4) + 1}-bg)`,
      fg: `var(--person-${(i % 4) + 1}-fg)`,
      voted: p.votingStatus !== PollVotingStatus.None,
    })),
  );

  readonly missingVotersText = computed(() => {
    const missing = this.poll().participants
      .filter(p => p.votingStatus === PollVotingStatus.None)
      .map(p => p.name);

    if (missing.length === 0) {
      return this.translateService.instant('project.pollsTab.allVoted');
    }

    const names = missing.length > 3
      ? missing.slice(0, 2).join(', ') + ', +' + (missing.length - 2)
      : missing.join(', ');

    return this.translateService.instant('project.pollsTab.missingVoters', { names });
  });

  navigateToEdit(): void {
    const route = this.editRoute();
    if (route) {
      this.router.navigate(route);
    }
  }
}
