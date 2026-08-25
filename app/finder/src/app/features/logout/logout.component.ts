import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '@common/data/user.store';

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

    userStore.logout();
    void router.navigate(['/']);
  }
}
