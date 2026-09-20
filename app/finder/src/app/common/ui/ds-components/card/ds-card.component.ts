import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { HlmCard } from '@spartan-ng/helm/card';

@Component({
    selector: 'ds-card',
    imports: [HlmCard],
    templateUrl: './ds-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsCardComponent {
    padding = input<number>(20);
    accentBorder = input<boolean>(false);
    fill = input<boolean>(false);

    // `!` modifiers override HlmCard's default border/display/overflow utilities.
    protected readonly variantClass = computed(() => {
        const border = this.accentBorder()
            ? 'border-[var(--accent-border)]!'
            : 'border-[var(--border-hairline-soft)]!';
        const shape = this.fill()
            ? 'flex! flex-col overflow-hidden! h-full'
            : 'block! overflow-visible!';
        return `${border} ${shape}`;
    });
}
