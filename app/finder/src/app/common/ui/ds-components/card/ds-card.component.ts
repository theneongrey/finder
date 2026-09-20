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
    // (HlmCard's `ring-1 ring-foreground/10` is neutralised with `ring-0!` in the
    // template — otherwise it renders a hard 1px currentColor ring that reads as a
    // black border and swamps the soft card shadow.)
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
