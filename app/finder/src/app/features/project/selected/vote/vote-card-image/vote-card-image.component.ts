import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-vote-card-image',
  templateUrl: './vote-card-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TranslatePipe],
  host: {
    class: 'tw:h-full tw:flex tw:flex-col',
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
