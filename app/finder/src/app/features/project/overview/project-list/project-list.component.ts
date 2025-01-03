import { Component, input } from '@angular/core';
import { Project } from '../../_models/project.model';

@Component({
  selector: 'app-project-list',
  imports: [],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent {
  projects = input.required<Project[]>();
}
