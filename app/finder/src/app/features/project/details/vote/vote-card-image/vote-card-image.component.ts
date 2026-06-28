import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-vote-card-image',
  templateUrl: './vote-card-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
})
export class VoteCardImageComponent {
  text = input('');
  description = input('');
  previewImageUrl = input('');
  link = input('');
}
