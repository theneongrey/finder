import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsButtonComponent } from '../../../../../common/ui/ds-components/button/ds-button.component';

@Component({
  selector: 'app-vote-card-text',
  templateUrl: './vote-card-text.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButtonComponent],
})
export class VoteCardTextComponent {
  text = input('');
  description = input('');
  link = input('');

  linkLabel = computed(() => {
    const l = this.link();
    return l.length > 50 ? l.slice(0, 50) + '…' : l;
  });

  openLink(url: string): void {
    window.open(url, '_blank', 'noopener noreferrer');
  }
}
