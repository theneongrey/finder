import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-vote-card-image',
  templateUrl: './vote-card-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardImageComponent {
  text = input('');
  description = input('');
  previewImageUrl = input('');
}
