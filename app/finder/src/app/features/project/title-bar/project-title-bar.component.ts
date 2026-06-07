import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { UserAvatarComponent } from '../../../common/ui/components/user-avatar/user-avatar.component';
import { Button } from 'primeng/button';
import { TitleService } from '../../../common/services/title.service';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-project-title-bar',
  imports: [Menu, UserAvatarComponent, Button, RouterLink, NgOptimizedImage],
  templateUrl: './project-title-bar.component.html',
  styleUrl: './project-title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTitleBarComponent {
  private userStore = inject(UserStore);
  private titleService = inject(TitleService);
  user = this.userStore.user;
  title = this.titleService.title;
  backRoute = this.titleService.backRoute;

  items: MenuItem[] = [
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      routerLink: ['/auth/logout'],
    },
  ];
}
