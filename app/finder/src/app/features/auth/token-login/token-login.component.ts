import { Component, effect, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth-token-login',
  imports: [],
  templateUrl: './token-login.component.html',
  styleUrl: './token-login.component.css',
})
export class TokenLoginComponent {
  private userStore = inject(UserStore);

  constructor(route: ActivatedRoute, router: Router) {
    const loginToken = route.snapshot.queryParams['token'];
    const redirecturl = route.snapshot.queryParams['redirecturl'];

    if (!loginToken) {
      router.navigate(['/']);
    }

    if (redirecturl) {
      this.userStore.setRedirectUrl(redirecturl);
    }

    this.userStore.loginByToken(loginToken);

    effect(() => {
      if (this.userStore.user()?.isAuthenticated) {
        router.navigate(['/']);
      }
    });
  }
}
