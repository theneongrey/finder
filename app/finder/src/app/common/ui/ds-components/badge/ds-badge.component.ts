import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
} from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { DsIconComponent } from '../icon/ds-icon.component';

export type BadgeTone =
    | 'accent'
    | 'neutral'
    | 'warning'
    | 'viewer'
    | 'contributor'
    | 'manager'
    | 'success';
export type BadgeSize = 'sm' | 'md' | 'lg';

// `!` modifiers override the utility classes HlmBadge injects (bg-primary,
// text-primary-foreground, px-2 py-0.5, text-xs) which share our specificity.
const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
    accent: 'bg-[var(--accent-tint)]! text-[var(--accent)]!',
    neutral: 'bg-[var(--sand-100)]! text-[var(--ink-400)]!',
    warning: 'bg-[var(--amber-100)]! text-[var(--warning)]!',
    viewer: 'bg-[var(--sand-100)]! text-[var(--ink-400)]!',
    contributor: 'bg-[var(--accent-tint)]! text-[var(--accent)]!',
    manager: 'bg-[var(--purple-badge-bg)]! text-[var(--purple-fg)]!',
    success: 'bg-[var(--green-badge-bg)]! text-[var(--green-badge-fg)]!',
};

const BADGE_SIZE_CLASSES: Record<BadgeSize, string> = {
    sm: 'px-1.5! py-0! text-[var(--fs-micro)]! min-h-[20px]',
    md: 'px-[13px]! py-1.5! text-[var(--fs-ui-sm)]! min-h-[auto]',
    lg: 'px-[11px]! py-[5px]! text-[var(--fs-caption-sm)]! min-h-[26px]',
};

@Component({
    selector: 'ds-badge',
    imports: [DsIconComponent, HlmBadge],
    templateUrl: './ds-badge.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsBadgeComponent {
    tone = input<BadgeTone>('neutral');
    size = input<BadgeSize>('md');
    icon = input<string | undefined>(undefined);

    protected readonly toneClass = computed(
        () => BADGE_TONE_CLASSES[this.tone()] ?? BADGE_TONE_CLASSES['neutral'],
    );
    protected readonly sizeClass = computed(
        () => BADGE_SIZE_CLASSES[this.size()] ?? BADGE_SIZE_CLASSES['md'],
    );
}
