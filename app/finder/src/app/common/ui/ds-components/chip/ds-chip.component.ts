import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    model,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
    selector: 'ds-chip',
    imports: [DsIconComponent, HlmButton],
    templateUrl: './ds-chip.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsChipComponent {
    active = model<boolean>(false);
    label = input.required<string>();
    icon = input<string | undefined>(undefined);

    // `!` modifiers override HlmButton's default-variant utilities
    // (bg-primary, text-primary-foreground, border-transparent, hover:bg-primary/80).
    protected readonly stateClass = computed(() =>
        this.active()
            ? 'bg-[var(--teal-150)]! text-[var(--accent)]! border-[var(--teal-300)]!'
            : 'bg-white! text-[var(--ink-500)]! border-[var(--border-hairline)]!',
    );

    toggle(): void {
        this.active.set(!this.active());
    }
}
