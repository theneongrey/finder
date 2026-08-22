import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionDetail } from '../../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../../_shared/utils/date-option-format.service';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [NgClass, RouterLink, HlmBadge, HlmButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  private readonly translateService = inject(TranslateService);
  private readonly dateFormatService = inject(DateOptionFormatService);

  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');
  hideResults = input(false);

  private readonly parsed = computed(() =>
    this.dateFormatService.parse(this.option().text),
  );

  label(): string {
    return this.dateFormatService.labelFromEntry(this.parsed());
  }

  subLabel(): string | null {
    return this.dateFormatService.subLabelFromEntry(this.parsed());
  }

  voteIcon(choice: string | null): string {
    if (choice === '1') {
      return 'fa-circle-check';
    }
    if (choice === '2') {
      return 'fa-circle-xmark';
    }
    return 'fa-circle-question';
  }

  voteLabel(choice: string | null): string {
    if (choice === '1') {
      return this.translateService.instant(
        'project.votesOverview.voteLabel.yes',
      );
    }
    if (choice === '2') {
      return this.translateService.instant(
        'project.votesOverview.voteLabel.no',
      );
    }
    return this.translateService.instant(
      'project.votesOverview.voteLabel.open',
    );
  }

  voteColorClass(choice: string | null): string {
    if (choice === '1') {
      return 'text-green-600';
    }
    if (choice === '2') {
      return 'text-red-600';
    }
    return 'text-gray-400';
  }

  votesCountLabel(): string {
    const option = this.option();
    const yes = option.votes.filter((vote) => vote.choice === '1').length;
    const total = option.votes.length;
    const key =
      yes === 1
        ? 'project.votesOverview.votesCount'
        : 'project.votesOverview.votesCountPlural';
    return this.translateService.instant(key, { yes, total });
  }
}
