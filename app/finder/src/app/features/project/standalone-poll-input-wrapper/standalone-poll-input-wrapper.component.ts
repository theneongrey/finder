import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslateService } from '@ngx-translate/core';
import { PollInputComponent } from '../_shared/ui/poll-input/poll-input.component';

@Component({
  selector: 'app-standalone-poll-input-wrapper',
  imports: [
    TitleBarComponent,
    MaxHeightMinusHeaderDirective,
    PollInputComponent,
  ],
  templateUrl: './standalone-poll-input-wrapper.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandalonePollInputWrapperComponent {
  constructor() {
    const titleBarService = inject(TitleBarService);
    const translateService = inject(TranslateService);
    titleBarService.setTitle(
      translateService.instant('project.standaloneInput.addNew.cto'),
    );
  }
}
