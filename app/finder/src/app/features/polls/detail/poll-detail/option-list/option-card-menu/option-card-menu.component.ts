import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';

/** The ⋮ menu in an option card's header; renders nothing when there are no items. */
@Component({
    selector: 'app-option-card-menu',
    templateUrl: './option-card-menu.component.html',
    imports: [TranslatePipe, DsButtonComponent, DsMenuComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class OptionCardMenuComponent {
    items = input.required<MenuItem[]>();
}
