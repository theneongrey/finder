import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-vote-card-text',
  templateUrl: './vote-card-text.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
})
export class VoteCardTextComponent {
  text = input('');
  description = input('');
  link = input('');
}
