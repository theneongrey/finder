import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';

@Component({
    selector: 'ds-stepper',
    templateUrl: './ds-stepper.component.html',
    styleUrl: './ds-stepper.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: block' },
})
export class DsStepperComponent {
    steps = input.required<number>();
    current = input(1);

    protected readonly bars = computed(() => {
        const n = this.steps();
        const cur = this.current();
        return Array.from({ length: n }, (_, i) => {
            if (i < cur - 1) {
                return 'var(--accent)';
            }
            if (i === cur - 1) {
                return 'var(--accent)';
            }
            return 'var(--cream-400)';
        });
    });
}
