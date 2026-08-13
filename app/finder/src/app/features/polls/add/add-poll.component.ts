import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslateService } from '@ngx-translate/core';
import { PollInputComponent } from '../_shared/ui/poll-input/poll-input.component';

@Component({
  selector: 'app-add-poll',
  imports: [TitleBarComponent, PollInputComponent],
  templateUrl: './add-poll.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPollComponent {
  constructor() {
    const titleBarService = inject(TitleBarService);
    const translateService = inject(TranslateService);
    titleBarService.setTitle(
      translateService.instant('project.standaloneInput.addNew.cto'),
    );
  }
}
