import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
    selector: 'ds-vote-buttons',
    imports: [DsIconComponent],
    templateUrl: './ds-vote-buttons.component.html',
    styleUrl: './ds-vote-buttons.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: block;' },
})
export class DsVoteButtonsComponent {
    showMaybe = input<boolean>(false);

    yes = output<void>();
    no = output<void>();
    skip = output<void>();
    maybe = output<void>();
}
