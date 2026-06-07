import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectTitleBarComponent } from './title-bar/project-title-bar.component';
import { RouterOutlet } from '@angular/router';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { MaxHeightMinusHeaderDirective } from '../../common/ui/directives/max-height-minus-header.directive';

@Component({
  selector: 'app-project',
  imports: [
    ProjectTitleBarComponent,
    RouterOutlet,
    ScrollPanelModule,
    MaxHeightMinusHeaderDirective,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
