import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-project-title',
  imports: [RouterLink, NgOptimizedImage, Button, Tooltip],
  templateUrl: './project-title.component.html',
  styleUrl: './project-title.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTitleComponent {
  private userStore = inject(UserStore);

  public user = this.userStore.user;
}
