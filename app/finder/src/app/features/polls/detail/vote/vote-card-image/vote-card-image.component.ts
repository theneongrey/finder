import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
  selector: 'app-vote-card-image',
  templateUrl: './vote-card-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsIconComponent, TranslatePipe],
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
