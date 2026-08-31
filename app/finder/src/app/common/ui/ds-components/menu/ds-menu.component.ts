import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { DsIconComponent } from '../icon/ds-icon.component';

export interface MenuItem {
    icon: string;
    label: string;
    danger?: boolean;
    onClick: () => void;
}

@Component({
    selector: 'ds-menu',
    imports: [...HlmDropdownMenuImports, DsIconComponent],
    templateUrl: './ds-menu.component.html',
    styleUrl: './ds-menu.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsMenuComponent {
    items = input.required<MenuItem[]>();
}
