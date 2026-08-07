import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-vote-card-rating',
  templateUrl: './vote-card-rating.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardRatingComponent {
  text = input('');
  description = input('');
}
