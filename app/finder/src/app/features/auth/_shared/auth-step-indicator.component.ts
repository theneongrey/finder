import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';

@Component({
    selector: 'app-auth-step-indicator',
    templateUrl: './auth-step-indicator.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'flex gap-[7px] mb-[16px]' },
})
export class AuthStepIndicatorComponent {
    step = input.required<number>();
    total = input<number>(3);

    protected segments = computed(() =>
        Array.from({ length: this.total() }, (_, i) => i + 1),
    );

    protected segmentClass = computed(() => {
        const current = this.step();
        const last = this.total();
        return (i: number) => {
            if (i > current) return 'bg-[var(--sand-200)]';
            if (i === last && current === last) return 'bg-[#5d9a56]';
            return 'bg-[var(--accent)]';
        };
    });
}
