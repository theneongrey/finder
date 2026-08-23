import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { DsIconComponent } from '../icon/ds-icon.component';

const SIZE_MAP = { sm: 27, md: 34, lg: 38 } as const;
type AvatarSize = keyof typeof SIZE_MAP;

@Component({
  selector: 'ds-avatar',
  imports: [...HlmAvatarImports, DsIconComponent],
  templateUrl: './ds-avatar.component.html',
  styleUrl: './ds-avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsAvatarComponent {
  initial = input.required<string>();
  bg = input<string>('var(--person-1-bg)');
  fg = input<string>('var(--person-1-fg)');
  size = input<AvatarSize | number>('md');
  /** undefined = no voting context; true = voted (ring + check badge); false = pending (dashed border) */
  voted = input<boolean | undefined>(undefined);

  protected readonly px = computed(() => {
    const s = this.size();
    return typeof s === 'number' ? s : SIZE_MAP[s] ?? SIZE_MAP['md'];
  });
  protected readonly fontSize = computed(() => Math.round(this.px() * 0.4));
  protected readonly isPending = computed(() => this.voted() === false);
}
