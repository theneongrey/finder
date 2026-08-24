import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { PollInputStateService } from './poll-input-state.service';
import { PollInputWizardComponent } from './poll-input-wizard/poll-input-wizard.component';

export type { OptionEntry, DateOptionEntry, DateOptionType } from './poll-input-form/poll-input-form.component';
export type { PendingInvite } from '../share-content/share-invite-form/share-invite-form.component';

@Component({
  selector: 'app-poll-input',
  templateUrl: './poll-input.component.html',
  host: { class: 'block h-full' },
  imports: [PollInputWizardComponent],
  providers: [PollInputStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputComponent {
  protected readonly state = inject(PollInputStateService);
}
