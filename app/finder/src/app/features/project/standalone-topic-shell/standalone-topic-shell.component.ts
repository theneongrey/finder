import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { TopicInputComponent } from '../details/topic-input/topic-input.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-standalone-topic-shell',
  imports: [TitleBarComponent, MaxHeightMinusHeaderDirective, TopicInputComponent],
  templateUrl: './standalone-topic-shell.component.html',
  host: { class: 'tw:block tw:h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneTopicShellComponent {
  constructor() {
    const titleBarService = inject(TitleBarService);
    const translateService = inject(TranslateService);
    titleBarService.setTitle(
      translateService.instant('project.standaloneInput.addNew.cto'),
    );
  }
}
