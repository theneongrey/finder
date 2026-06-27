import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UserStore } from '../../../data/user.store';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { Button } from 'primeng/button';
import { TitleService } from '../../../services/title.service';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-title-bar',
  imports: [Menu, UserAvatarComponent, Button, RouterLink, NgOptimizedImage],
  templateUrl: './title-bar.component.html',
  styleUrl: './title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBarComponent {
  private userStore = inject(UserStore);
  private titleService = inject(TitleService);
  private translateService = inject(TranslateService);

  user = this.userStore.user;
  title = this.titleService.title;
  backRoute = this.titleService.backRoute;
  isHidden = this.titleService.isHidden;

  private logoutLabel = this.translateService.translate('titleBar.logout');
  private settingsLabel = this.translateService.translate('titleBar.settings');

  items = computed<MenuItem[]>(() => [
    {
      label: this.logoutLabel(),
      icon: 'pi pi-sign-out',
      routerLink: ['/auth/logout'],
    },
    {
      label: this.settingsLabel(),
      icon: 'pi pi-cog',
      routerLink: ['/settings'],
    },
  ]);
}
