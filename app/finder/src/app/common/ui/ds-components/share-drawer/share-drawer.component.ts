import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DsBottomSheetComponent } from '../bottom-sheet/ds-bottom-sheet.component';
import { ShareContentComponent } from './share-content/share-content.component';
import {
  SharedWith,
  VisibilityType,
} from '../../../../features/polls/_shared/models/poll-detail.model';
import { SharingStore } from '../../../../features/polls/_shared/data/sharing.store';

@Component({
  selector: 'app-share-drawer',
  imports: [DsBottomSheetComponent, ShareContentComponent],
  templateUrl: './share-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDrawerComponent {
  private readonly sharingStore = inject(SharingStore);
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  projectName = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();
  visible = model(false);

  readonly subtitle = this.translateService.translate('project.share.title');

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.sharingStore.loadContacts(this.projectId());
      }
    });
  }
}
