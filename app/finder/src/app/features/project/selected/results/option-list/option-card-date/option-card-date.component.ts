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
import { OptionDetail } from '../../../../_shared/models/project-detail.model';
import {
  parseDateOptionText,
  DateOptionEntry,
} from '../../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [NgClass, RouterLink, HlmBadge, HlmButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  private readonly translateService = inject(TranslateService);

  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');
  hideResults = input(false);

  parsed = computed<DateOptionEntry>(() =>
    parseDateOptionText(this.option().text),
  );

  formatDate(date: Date): string {
    return date.toLocaleDateString(
      this.translateService.currentLang() ?? undefined,
      {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    );
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString(
      this.translateService.currentLang() ?? undefined,
      { hour: '2-digit', minute: '2-digit' },
    );
  }

  weekdayName(day: number): string {
    return this.translateService.instant(
      `project.pollInput.date.weekdays.${day}`,
    );
  }

  label(): string {
    const p = this.parsed();
    switch (p.type) {
      case 'weekday':
        return this.weekdayName(p.weekday!);
      case 'date':
        return this.formatDate(p.date!);
      case 'date-range':
        if (p.startTime) {
          return `${this.formatDate(p.date!)} – ${this.formatTime(p.startTime)}`;
        }
        return `${this.formatDate(p.date!)} → ${this.formatDate(p.endDate!)}`;
      case 'time':
        return this.formatTime(p.startTime!);
      case 'time-range':
        return `${this.formatTime(p.startTime!)} → ${this.formatTime(p.endTime!)}`;
    }
  }

  subLabel(): string | null {
    const p = this.parsed();
    if ((p.type === 'weekday' || p.type === 'date') && p.startTime) {
      return this.formatTime(p.startTime);
    }
    if (p.type === 'date-range' && p.startTime) {
      const endDateStr = this.formatDate(p.endDate!);
      return p.endTime ? `${endDateStr} – ${this.formatTime(p.endTime)}` : endDateStr;
    }
    return null;
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
