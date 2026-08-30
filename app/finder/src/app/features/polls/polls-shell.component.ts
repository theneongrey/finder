import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';

@Component({
  selector: 'app-polls',
  imports: [RouterOutlet, TitleBarComponent],
  templateUrl: './polls-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollsShellComponent {}
