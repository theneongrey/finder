import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { HlmAvatar, HlmAvatarFallback } from '@spartan-ng/helm/avatar';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-avatar',
  imports: [HlmAvatar, HlmAvatarFallback],
  templateUrl: './user-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  user = input.required<User>();
  size = input<'normal' | 'large' | 'xlarge'>('normal');
  firstLetter = computed(() => this.user().name?.[0]?.toUpperCase() ?? '');
  sizeClass = computed(
    () =>
      ({ normal: 'size-8', large: 'size-10', xlarge: '!size-16' })[
        this.size()
      ],
  );
}
