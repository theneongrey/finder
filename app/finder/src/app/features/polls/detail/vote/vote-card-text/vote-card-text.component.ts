import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsIconComponent } from '../../../../../common/ui/ds-components/icon/ds-icon.component';

@Component({
  selector: 'app-vote-card-text',
  templateUrl: './vote-card-text.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsIconComponent],
})
export class VoteCardTextComponent {
  text = input('');
  description = input('');
  link = input('');
}
