import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { UserStore } from '../../../data/user.store';
import { TitleBarService } from '../../../services/title-bar.service';
import { LoadingComponent } from '@ds/loading/loading.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-title-bar',
  imports: [
    NgOptimizedImage,
    LoadingComponent,
    UserAvatarComponent,
    DsButtonComponent,
    DsMenuComponent,
    TranslatePipe,
  ],
  templateUrl: './title-bar.component.html',
  styleUrl: './title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBarComponent {
  private readonly userStore = inject(UserStore);
  private readonly titleService = inject(TitleBarService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  user = this.userStore.user;
  title = this.titleService.title;
  subtitle = this.titleService.subtitle;
  titleDisabled = computed(() => this.title() === null);
  backRoute = this.titleService.backRoute;
  backFn = this.titleService.backFn;
  progress = this.titleService.progress;
  isHidden = this.titleService.isHidden;
  hasBack = computed(() => !!(this.backRoute() || this.backFn()));

  isScrolled = toSignal(
    fromEvent(window, 'scroll', { passive: true }).pipe(
      map(() => window.scrollY > 40),
      startWith(false),
      distinctUntilChanged(),
    ),
    { initialValue: false },
  );

  private readonly settingsLabel =
    this.translateService.translate('titleBar.settings');
  private readonly logoutLabel =
    this.translateService.translate('titleBar.logout');

  menuItems = computed<MenuItem[]>(() => [
    {
      icon: 'arrow-right',
      label: this.settingsLabel(),
      onClick: () => this.navigateTo('/settings'),
    },
    {
      icon: 'arrow-right',
      label: this.logoutLabel(),
      onClick: () => this.navigateTo('/logout'),
    },
  ]);

  onBack(): void {
    const fn = this.backFn();
    if (fn) {
      fn();
    } else if (this.backRoute()) {
      this.router.navigate([this.backRoute()!]);
    }
  }

  login(): void {
    this.userStore.setRedirectUrl(this.router.url);
    this.router.navigate(['/auth/request-email']);
  }

  private navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
