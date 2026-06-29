import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  selector: 'app-option-card-rating',
  templateUrl: './option-card-rating.component.html',
  imports: [NgClass, RouterLink, Tag, Button, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardRatingComponent {
  private readonly translateService = inject(TranslateService);

  option = input.required<OptionDetail>();
  isMostVoted = input(false);
  projectId = input('');
  pollId = input('');

  averageRating = computed(() => {
    const rated = this.option().votes.filter(
      (v) => v.choice && !isNaN(parseInt(v.choice)),
    );
    if (!rated.length) return 0;
    return (
      rated.reduce((sum, v) => sum + parseInt(v.choice!), 0) / rated.length
    );
  });

  starsArray = [1, 2, 3, 4, 5];

  isStarFilled(star: number): boolean {
    return star <= Math.round(this.averageRating());
  }

  userStarFilled(star: number): boolean {
    const choice = this.option().choice;
    return !!choice && star <= parseInt(choice);
  }

  ratingsCountLabel(): string {
    const count = this.option().votes.filter(
      (v) => v.choice && !isNaN(parseInt(v.choice)),
    ).length;
    const key =
      count === 1
        ? 'project.votesOverview.ratingsCount'
        : 'project.votesOverview.ratingsCountPlural';
    return this.translateService.instant(key, { count });
  }

  averageLabel(): string {
    const avg = this.averageRating();
    return this.translateService.instant('project.votesOverview.averageRating', {
      avg: avg > 0 ? avg.toFixed(1) : '—',
    });
  }
}
