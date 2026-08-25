import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { AvatarStackComponent } from '@smart/avatar-stack/avatar-stack.component';
import { HomeDemoCardComponent } from './home-demo-card/home-demo-card.component';
import { PPL } from '../home.constants';

@Component({
  selector: 'app-home-hero',
  imports: [FormsModule, TranslatePipe, DsStatusDotComponent, DsBadgeComponent, AvatarStackComponent, HomeDemoCardComponent],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroComponent {
  private router = inject(Router);

  readonly email = signal('');
  readonly emailError = signal(false);
  readonly emailSent = signal(false);

  readonly faces = ['G', 'F', 'M', 'L', 'N'].map(k => ({ name: PPL[k].name }));

  onStart(): void {
    const v = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
      this.emailError.set(true);
      return;
    }
    this.emailSent.set(true);
    this.emailError.set(false);
    this.router.navigate(['/auth/request-email'], { queryParams: { email: v } });
  }

  onEmailChange(val: string): void {
    this.email.set(val);
    this.emailError.set(false);
    this.emailSent.set(false);
  }

  onEmailKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') { this.onStart(); }
  }
}
