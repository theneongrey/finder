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
import { ProjectStore } from '../../../_shared/data/project.store';
import {
  SharedWith,
  VisibilityType,
} from '../../../_shared/models/project-detail.model';
import { ShareContentComponent } from './share-content/share-content.component';

@Component({
  selector: 'app-share-drawer',
  imports: [Drawer, TranslatePipe, ShareContentComponent],
  templateUrl: './share-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDrawerComponent {
  private readonly projectStore = inject(ProjectStore);

  projectId = input.required<string>();
  projectName = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();
  visible = model(false);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.projectStore.loadContacts(this.projectId());
      }
    });
  }
}
