import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { PollInputComponent } from '../_shared/ui/poll-input/poll-input.component';

@Component({
  selector: 'app-add-poll',
  imports: [TitleBarComponent, PollInputComponent],
  templateUrl: './add-poll.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPollComponent {}
