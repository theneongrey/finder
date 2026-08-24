import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface AnswerSummaryItem {
  id: string;
  label: string;
  badgeBg: string;
  badgeFg: string;
  dotBg: string;
  badgeKey: string;
  ratingValue: number;
  rowBg: string;
  fontWeight: string;
}

@Component({
  selector: 'app-vote-answer-summary',
  templateUrl: './vote-answer-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class VoteAnswerSummaryComponent {
  items = input<AnswerSummaryItem[]>([]);
  itemClick = output<string>();
}
