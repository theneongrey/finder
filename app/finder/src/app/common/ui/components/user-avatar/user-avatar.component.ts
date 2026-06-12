import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-avatar',
  imports: [Avatar],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  user = input.required<User>();
  size = input<'normal' | 'large' | 'xlarge'>('normal');
  firstLetter = computed(() => this.user().name?.[0]?.toUpperCase() ?? '');
}
