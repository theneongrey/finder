import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { STEPS } from './home.constants';

@Component({
  selector: 'app-home-steps',
  imports: [TranslatePipe],
  templateUrl: './home-steps.component.html',
  styleUrl: './home-steps.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeStepsComponent {
  readonly steps = STEPS;
}
