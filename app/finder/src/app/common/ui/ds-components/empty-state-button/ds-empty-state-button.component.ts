import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { DsIconComponent } from '../icon/ds-icon.component';

export type EmptyStateLayout = 'row' | 'tile';

@Component({
    selector: 'ds-empty-state-button',
    imports: [DsIconComponent, HlmButton],
    templateUrl: './ds-empty-state-button.component.html',
    styleUrl: './ds-empty-state-button.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents;' },
})
export class DsEmptyStateButtonComponent {
    layout = input<EmptyStateLayout>('row');
    icon = input<string>('plus');
    label = input.required<string>();

    clicked = output<void>();
}
