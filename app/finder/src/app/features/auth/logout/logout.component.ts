import { Component, effect, inject, untracked } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css',
})
export class LogoutComponent {
  private userStore = inject(UserStore);

  constructor(router: Router) {
    this.userStore.logout();
    router.navigate(['/']);
  }
}
