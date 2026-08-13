import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { UserStore } from '../../../data/user.store';
import { TitleBarService } from '../../../services/title-bar.service';
import { LoadingComponent } from '@ds/loading/loading.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';

@Component({
  selector: 'app-title-bar',
  imports: [
    RouterLink,
    NgOptimizedImage,
    LoadingComponent,
    UserAvatarComponent,
    DsButtonComponent,
    DsMenuComponent,
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
  titleDisabled = computed(() => this.title === null);
  backRoute = this.titleService.backRoute;
  isHidden = this.titleService.isHidden;

  isScrolled = toSignal(
    fromEvent(window, 'scroll').pipe(
      map(() => window.scrollY > 0),
      startWith(false),
    ),
    { initialValue: false },
  );

  private readonly settingsLabel = this.translateService.translate('titleBar.settings');
  private readonly logoutLabel = this.translateService.translate('titleBar.logout');

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

  private navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
