import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PollInputComponent } from '../../_shared/ui/poll-input/poll-input.component';

@Component({
  selector: 'app-edit-poll',
  imports: [PollInputComponent],
  template: `<app-poll-input mode="edit" [pollId]="pollId()" />`,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPollComponent {
  pollId = input<string | undefined>(undefined);
}
