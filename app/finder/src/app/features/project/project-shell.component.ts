import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-project',
  imports: [RouterOutlet],
  templateUrl: './project-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShellComponent {}
