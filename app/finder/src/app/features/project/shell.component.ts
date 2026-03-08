import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectTitleComponent } from './title/project-title.component';
import { RouterOutlet } from '@angular/router';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { MaxHeightMinusHeaderDirective } from '../../common/ui/directives/max-height-minus-header.directive';
import { ProjectFooterComponent } from './footer/project-footer.component';

@Component({
  selector: 'app-project',
  imports: [
    ProjectTitleComponent,
    RouterOutlet,
    ScrollPanelModule,
    MaxHeightMinusHeaderDirective,
    ProjectFooterComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
