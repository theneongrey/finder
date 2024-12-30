import { Component, effect, inject, untracked } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-request-email',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private userStore = inject(UserStore);

  constructor(router: Router) {
    effect(() => {
      const user = this.userStore.user();
      if (!user) {
        return;
      }

      if (user.isAuthenticated) {
        untracked(() => {
          const redirectUrl = this.userStore.redirectUrl();
          if (redirectUrl) {
            router.navigate([redirectUrl]);
          }
        });
      } else {
        router.navigate(['/auth/request-email']);
      }
    });

    this.userStore.getUser();
  }
}
