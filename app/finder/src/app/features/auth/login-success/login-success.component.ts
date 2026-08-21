import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-login-success',
  imports: [TranslatePipe],
  templateUrl: './login-success.component.html',
  styleUrl: './login-success.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class LoginSuccessComponent implements OnDestroy {
  readonly barWidth = signal('8%');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const router = inject(Router);
    const target = (history.state as { target?: string }).target ?? '/project';

    setTimeout(() => this.barWidth.set('100%'), 60);

    this.timer = setTimeout(() => {
      void router.navigate([target]);
    }, 2000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
