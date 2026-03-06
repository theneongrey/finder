import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectTitleComponent } from './title/project-title.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-project-shell',
  imports: [ProjectTitleComponent, RouterOutlet],
  templateUrl: './project-shell.component.html',
  styleUrl: './project-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
