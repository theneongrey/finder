import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutComponent {
  private userStore = inject(UserStore);

  constructor() {
    const router = inject(Router);

    this.userStore.logout();
    router.navigate(['/']);
  }
}
