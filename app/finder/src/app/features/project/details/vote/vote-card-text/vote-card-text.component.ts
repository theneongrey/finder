import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-vote-card-text',
  templateUrl: './vote-card-text.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardTextComponent {
  text = input('');
  description = input('');
}
