import { Component } from '@angular/core';
import { ProjectTitleComponent } from '../shell/title/project-title.component';
import { RouterOutlet } from '@angular/router';
import { ProjectListTitleBarComponent } from './title-bar/project-list-title-bar.component';
import { ProjectListComponent } from './project-list/project-list.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ProjectTitleComponent,
    RouterOutlet,
    ProjectListTitleBarComponent,
    ProjectListComponent,
  ],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
})
export class ProjectOverviewComponent {}
