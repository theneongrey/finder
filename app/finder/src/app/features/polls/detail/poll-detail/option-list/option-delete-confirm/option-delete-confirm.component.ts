import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';

/** "Really delete?" row shown in an option card's action slot while a delete is pending. */
@Component({
    selector: 'app-option-delete-confirm',
    templateUrl: './option-delete-confirm.component.html',
    imports: [TranslatePipe, DsButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionDeleteConfirmComponent {
    cancelled = output<void>();
    confirmed = output<void>();
}
