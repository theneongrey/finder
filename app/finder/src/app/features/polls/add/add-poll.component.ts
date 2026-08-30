import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PollInputComponent } from './poll-input/poll-input.component';

@Component({
  selector: 'app-add-poll',
  imports: [PollInputComponent],
  templateUrl: './add-poll.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPollComponent {}
