import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectTitleComponent } from './title/project-title.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-project',
  imports: [ProjectTitleComponent, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
