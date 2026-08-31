import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';

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

    openLink(url: string): void {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
