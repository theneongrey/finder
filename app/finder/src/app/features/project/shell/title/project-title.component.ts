import { Component, inject } from '@angular/core';
import { UserStore } from '../../../../common/data/user.store';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-title',
  imports: [RouterLink],
  templateUrl: './project-title.component.html',
  styleUrl: './project-title.component.css',
})
export class ProjectTitleComponent {
  private userStore = inject(UserStore);

  public user = this.userStore.user;
}
