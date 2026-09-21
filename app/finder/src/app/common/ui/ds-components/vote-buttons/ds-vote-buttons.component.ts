import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';
import { DsButtonComponent } from '../button/ds-button.component';

@Component({
    selector: 'ds-vote-buttons',
    imports: [DsIconComponent, DsButtonComponent],
    templateUrl: './ds-vote-buttons.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: block;' },
})
export class DsVoteButtonsComponent {
    showMaybe = input<boolean>(false);
    showSkip = input<boolean>(false);
    skipLabel = input<string>('');

    yes = output<void>();
    no = output<void>();
    skip = output<void>();
    maybe = output<void>();
}
