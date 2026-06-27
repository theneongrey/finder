import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { RouterOutlet } from '@angular/router';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';

@Component({
  selector: 'app-project-shell',
  imports: [TitleBarComponent, RouterOutlet, MaxHeightMinusHeaderDirective],
  templateUrl: './details-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailShellComponent {}
