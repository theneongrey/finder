import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';

@Component({
  selector: 'app-vote-card-image',
  templateUrl: './vote-card-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButtonComponent],
  host: {
    class: 'h-full flex flex-col',
  },
})
export class VoteCardImageComponent {
  text = input('');
  description = input('');
  imageUrl = input('');
  link = input('');

  protected openLink(link: string) {
    window.open(link, '_blank', 'noopener noreferrer');
  }
}
