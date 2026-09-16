import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';

@Component({
    selector: 'ds-side-drawer',
    imports: [...HlmSheetImports],
    templateUrl: './ds-side-drawer.component.html',
    styleUrl: './ds-side-drawer.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSideDrawerComponent {
    open = input<boolean>(false);

    dismissed = output<void>();

    protected onStateChanged(state: string): void {
        if (state === 'closed') {
            this.dismissed.emit();
        }
    }
}
