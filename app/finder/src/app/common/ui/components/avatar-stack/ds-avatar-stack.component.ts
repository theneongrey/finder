import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DsAvatarComponent } from '../avatar/ds-avatar.component';

export interface AvatarItem {
  initial: string;
  bg: string;
  fg: string;
}

@Component({
  selector: 'ds-avatar-stack',
  imports: [DsAvatarComponent],
  templateUrl: './ds-avatar-stack.component.html',
  styleUrl: './ds-avatar-stack.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsAvatarStackComponent {
  avatars = input<AvatarItem[]>([]);
  max = input<number>(4);
  size = input<'sm' | 'md' | 'lg'>('md');
  showAdd = input<boolean>(false);

  addClicked = output<void>();

  protected readonly px = computed(() => {
    const s = this.size();
    return s === 'sm' ? 27 : s === 'lg' ? 38 : 29;
  });
  protected readonly shown = computed(() => this.avatars().slice(0, this.max()));
  protected readonly extra = computed(() => this.avatars().length - this.shown().length);
  protected readonly overflowFontSize = computed(() => Math.round(this.px() * 0.36));
}
