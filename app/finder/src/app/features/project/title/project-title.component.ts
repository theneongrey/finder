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
  selector: 'app-project-title',
  imports: [Menu, UserAvatarComponent, Button, RouterLink, NgOptimizedImage],
  templateUrl: './project-title.component.html',
  styleUrl: './project-title.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTitleComponent {
  private userStore = inject(UserStore);
  private titleService = inject(TitleService);
  user = this.userStore.user;
  backRoute = this.titleService.backRoute;

  items: MenuItem[] = [
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      routerLink: ['/auth/logout'],
    },
  ];
}
