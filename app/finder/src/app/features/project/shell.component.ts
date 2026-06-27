import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { RouterOutlet } from '@angular/router';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { MaxHeightMinusHeaderDirective } from '../../common/ui/directives/max-height-minus-header.directive';

@Component({
  selector: 'app-project',
  imports: [
    TitleBarComponent,
    RouterOutlet,
    ScrollPanelModule,
    MaxHeightMinusHeaderDirective,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
