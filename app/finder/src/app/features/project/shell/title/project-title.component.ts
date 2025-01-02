import { Component, inject } from '@angular/core';
import { UserStore } from '../../../../common/data/user.store';

@Component({
  selector: 'app-project-title',
  imports: [],
  templateUrl: './project-title.component.html',
  styleUrl: './project-title.component.css',
})
export class ProjectTitleComponent {
  private userStore = inject(UserStore);

  public user = this.userStore.user;
}
