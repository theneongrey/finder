import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionType } from '../../models/poll-detail.model';
import { PollItem } from '../../models/poll-item.model';
import { PollRole } from '../../models/poll-role.enum';
import { TimeSincePipe } from '../../../overview/_pipe/time-ago.pipe';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { DsAvatarStackComponent, AvatarItem } from '@ds/avatar-stack/ds-avatar-stack.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsProgressBarComponent } from '@ds/progress-bar/ds-progress-bar.component';
import { PollTypeBadgeComponent } from '../poll-type-badge/poll-type-badge.component';

@Component({
  selector: 'app-poll-item',
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    TimeSincePipe,
    DsCardComponent,
    DsButtonComponent,
    DsStatusDotComponent,
    DsBadgeComponent,
    DsAvatarStackComponent,
    DsIconComponent,
    DsProgressBarComponent,
    PollTypeBadgeComponent,
  ],
  templateUrl: './poll-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  poll = input.required<PollItem>();
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

  readonly participantAvatars = computed<AvatarItem[]>(() =>
    this.poll().participants.map((p, i) => ({
      initial: p.name.charAt(0).toUpperCase(),
      bg: `var(--person-${(i % 4) + 1}-bg)`,
      fg: `var(--person-${(i % 4) + 1}-fg)`,
    })),
  );

  navigateToEdit(): void {
    const route = this.editRoute();
    if (route) {
      this.router.navigate(route);
    }
  }
}
