import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionDetail } from '../../../../_models/project-detail.model';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [NgClass, RouterLink, Tag, Button, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  private readonly translateService = inject(TranslateService);

  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  topicId = input('');

  parsedDates = (): { start: Date | null; end: Date | null } => {
    const parts = this.option().text.split(';');
    const startTs = parseInt(parts[0]);
    const endTs = parts[1] ? parseInt(parts[1]) : NaN;
    return {
      start: isNaN(startTs) ? null : new Date(startTs),
      end: isNaN(endTs) ? null : new Date(endTs),
    };
  };

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.translateService.currentLang() ?? undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  voteIcon(choice: string | null): string {
    if (choice === '1') return 'fa-circle-check';
    if (choice === '2') return 'fa-circle-xmark';
    return 'fa-circle-question';
  }

  voteLabel(choice: string | null): string {
    if (choice === '1') {
      return this.translateService.instant('project.votesOverview.voteLabel.yes');
    }
    if (choice === '2') {
      return this.translateService.instant('project.votesOverview.voteLabel.no');
    }
    return this.translateService.instant('project.votesOverview.voteLabel.open');
  }

  voteColorClass(choice: string | null): string {
    if (choice === '1') return 'tw:text-green-600';
    if (choice === '2') return 'tw:text-red-600';
    return 'tw:text-gray-400';
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
