import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SupportedLanguage, setStoredLanguage } from '../../common/i18n/languages';
import { DsButtonComponent } from '../../common/ui/components/button/button.component';
import { DsIconComponent } from '../../common/ui/components/icon/icon.component';
import { DsStatusDotComponent } from '../../common/ui/components/status-dot/status-dot.component';
import { DsBadgeComponent } from '../../common/ui/components/badge/badge.component';
import { DsAvatarComponent } from '../../common/ui/components/avatar/avatar.component';
import { DsAvatarGroupComponent } from '../../common/ui/components/avatar-group/avatar-group.component';
import { HomeDemoCardComponent } from './home-demo-card.component';
import { HomeStepsComponent } from './home-steps.component';
import { HomeIdeasSectionComponent } from './home-ideas-section.component';
import { HomeCodeAnimationComponent } from './home-code-animation.component';
import { PPL } from './home.constants';

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    DsButtonComponent,
    DsIconComponent,
    DsStatusDotComponent,
    DsBadgeComponent,
    DsAvatarComponent,
    DsAvatarGroupComponent,
    HomeDemoCardComponent,
    HomeStepsComponent,
    HomeIdeasSectionComponent,
    HomeCodeAnimationComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  readonly email = signal('');
  readonly emailError = signal(false);
  readonly emailSent = signal(false);
  readonly scrolled = signal(false);

  readonly faces = ['G', 'F', 'M', 'L', 'N'].map(k => PPL[k]);

  ngOnInit(): void {
    const lang = this.route.snapshot.data['lang'] as SupportedLanguage;
    if (lang) {
      this.translate.use(lang);
      setStoredLanguage(lang);
    }
  }

  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    this.scrolled.set(el.scrollTop > 20);
  }

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

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
