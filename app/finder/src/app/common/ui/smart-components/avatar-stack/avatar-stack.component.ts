import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

export interface AvatarUser {
  name: string;
  voted?: boolean;
}

@Component({
  selector: 'app-avatar-stack',
  imports: [UserAvatarComponent, HlmButton],
  templateUrl: './avatar-stack.component.html',
  styleUrl: './avatar-stack.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class AvatarStackComponent {
  users = input<AvatarUser[]>([]);
  max = input<number>(4);
  size = input<'sm' | 'md' | 'lg'>('md');
  showAdd = input<boolean>(false);
  addLabel = input<string>('Add member');

  addClicked = output<void>();

  protected readonly px = computed(() => {
    const s = this.size();
    return s === 'sm' ? 27 : s === 'lg' ? 38 : 29;
  });
  protected readonly shown = computed(() => this.users().slice(0, this.max()));
  protected readonly extra = computed(
    () => this.users().length - this.shown().length,
  );
  protected readonly overflowFontSize = computed(() =>
    Math.round(this.px() * 0.36),
  );
}
