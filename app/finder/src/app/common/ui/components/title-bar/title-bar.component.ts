import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { UserStore } from '../../../data/user.store';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { Button } from 'primeng/button';
import { TitleBarService } from '../../../services/title-bar.service';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-title-bar',
  imports: [
    Menu,
    UserAvatarComponent,
    Button,
    RouterLink,
    NgOptimizedImage,
    LoadingComponent,
    LoadingComponent,
  ],
  templateUrl: './title-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBarComponent {
  private userStore = inject(UserStore);
  private titleService = inject(TitleBarService);
  private translateService = inject(TranslateService);

  user = this.userStore.user;
  title = this.titleService.title;
  titleDisabled = computed(() => this.title === null);
  backRoute = this.titleService.backRoute;
  isHidden = this.titleService.isHidden;

  private logoutLabel = this.translateService.translate('titleBar.logout');
  private settingsLabel = this.translateService.translate('titleBar.settings');

  items = computed<MenuItem[]>(() => [
    {
      label: this.logoutLabel(),
      icon: 'fa-solid fa-right-from-bracket',
      routerLink: ['/auth/logout'],
    },
    {
      label: this.settingsLabel(),
      icon: 'fa-solid fa-gear',
      routerLink: ['/settings'],
    },
  ]);
}
