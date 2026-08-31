import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmCard } from '@spartan-ng/helm/card';

@Component({
    selector: 'ds-card',
    imports: [HlmCard],
    templateUrl: './ds-card.component.html',
    styleUrl: './ds-card.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsCardComponent {
    padding = input<number>(20);
    accentBorder = input<boolean>(false);
    fill = input<boolean>(false);
}
