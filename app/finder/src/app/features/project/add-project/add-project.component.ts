import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { ProjectStore } from '../_data/project.store';
import { Textarea } from 'primeng/textarea';
import { TitleService } from '../../../common/services/title.service';

@Component({
  selector: 'app-project-add-project',
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.css',
  imports: [FormsModule, InputText, Button, Textarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectAddProjectComponent {
  private readonly projectStore = inject(ProjectStore);

  projectName = model('');
  projectDescription = model('');

  constructor() {
    inject(TitleService).setBackroute('/project/');
  }

  addProject() {
    if (this.projectName()) {
      this.projectStore.addProject(this.projectName());
    }
  }
}
