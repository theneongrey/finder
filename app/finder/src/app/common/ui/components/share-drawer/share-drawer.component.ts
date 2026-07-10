import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Drawer } from 'primeng/drawer';
import { ShareContentComponent } from './share-content/share-content.component';
import {
  SharedWith,
  VisibilityType,
} from '../../../../features/project/_shared/models/project-detail.model';
import { SharingStore } from '../../../../features/project/_shared/data/sharing.store';

@Component({
  selector: 'app-share-drawer',
  imports: [Drawer, TranslatePipe, ShareContentComponent],
  templateUrl: './share-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDrawerComponent {
  private readonly sharingStore = inject(SharingStore);

  projectId = input.required<string>();
  projectName = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();
  visible = model(false);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.sharingStore.loadContacts(this.projectId());
      }
    });
  }
}
