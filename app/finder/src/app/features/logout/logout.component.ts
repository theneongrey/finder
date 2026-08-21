import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../../common/data/user.store';
import { UserService } from '../../common/services/user.service';

@Component({
  selector: 'app-auth-logout',
  imports: [],
  template: '',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutComponent {
  constructor() {
    const router = inject(Router);
    const userStore = inject(UserStore);
    const userService = inject(UserService);

    userService.logout().subscribe({
      next: () => {
        userStore.clearUserState();
        void router.navigate(['/']);
      },
      error: () => {
        userStore.clearUserState();
        void router.navigate(['/']);
      },
    });
  }
}
