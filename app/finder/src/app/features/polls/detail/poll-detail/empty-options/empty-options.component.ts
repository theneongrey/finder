import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

@Component({
    selector: 'app-empty-options',
    imports: [TranslatePipe, DsButtonComponent, DsIconComponent],
    templateUrl: './empty-options.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyOptionsComponent {
    canManage = input(false);
    isClosed = input(false);

    addOption = output<void>();

    /** The card only acts as a button when the user can actually add options. */
    readonly interactive = computed(() => this.canManage() && !this.isClosed());

    onCardClick() {
        if (this.interactive()) {
            this.addOption.emit();
        }
    }
}
