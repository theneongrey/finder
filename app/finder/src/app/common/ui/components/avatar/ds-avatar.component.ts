import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const SIZE_MAP = { sm: 27, md: 34, lg: 38 } as const;
type AvatarSize = keyof typeof SIZE_MAP;

@Component({
  selector: 'ds-avatar',
  template: `
    <div
      [style.width.px]="px()"
      [style.height.px]="px()"
      [style.background]="pending() ? 'var(--cream-50)' : bg()"
      [style.color]="pending() ? 'var(--sand-500)' : fg()"
      [style.font-size.px]="fontSize()"
      [style.border]="pending() ? '1.5px dashed var(--sand-400)' : ring() ? '2.5px solid #fff' : 'none'"
      class="ds-avatar-circle"
    >{{ initial() }}</div>
  `,
  styles: [`
    .ds-avatar-circle {
      border-radius: var(--radius-circle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      font-weight: var(--weight-bold);
      flex-shrink: 0;
      box-sizing: border-box;
      user-select: none;
    }
  `],
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
