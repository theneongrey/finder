import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';

const SIZE_MAP = { sm: 27, md: 34, lg: 38 } as const;
type AvatarSize = keyof typeof SIZE_MAP;

@Component({
  selector: 'ds-avatar',
  imports: [...HlmAvatarImports],
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
  ring    = input<boolean>(false);
  pending = input<boolean>(false);

  protected readonly px = computed(() => {
    const s = this.size();
    return typeof s === 'number' ? s : SIZE_MAP[s] ?? SIZE_MAP['md'];
  });
  protected readonly fontSize = computed(() => Math.round(this.px() * 0.4));
}
