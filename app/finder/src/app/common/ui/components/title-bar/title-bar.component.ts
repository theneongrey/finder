import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { UserStore } from '../../../data/user.store';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
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
    ...HlmDropdownMenuImports,
    UserAvatarComponent,
    Button,
    RouterLink,
    NgOptimizedImage,
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

  logoutLabel = this.translateService.translate('titleBar.logout');
  settingsLabel = this.translateService.translate('titleBar.settings');
}
