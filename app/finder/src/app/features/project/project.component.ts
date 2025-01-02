import { Component } from '@angular/core';
import { ProjectShellComponent } from './shell/project-shell.component';

@Component({
  selector: 'app-project',
  imports: [ProjectShellComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
})
export class ProjectComponent {}
