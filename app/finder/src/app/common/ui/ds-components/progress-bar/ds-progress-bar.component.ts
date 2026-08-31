import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { HlmProgressImports } from '@spartan-ng/helm/progress';

@Component({
    selector: 'ds-progress-bar',
    imports: [...HlmProgressImports],
    templateUrl: './ds-progress-bar.component.html',
    styleUrl: './ds-progress-bar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: block; width: 100%;' },
})
export class DsProgressBarComponent {
    percent = input.required<number>();
    height = input<number>(9);

    protected readonly clamped = computed(() =>
        Math.max(0, Math.min(100, this.percent())),
    );
}
