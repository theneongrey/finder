import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Drawer } from 'primeng/drawer';
import { SelectButton } from 'primeng/selectbutton';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { ProjectStore } from '../../../_shared/data/project.store';
import {
  SharedWith,
  VisibilityType,
} from '../../../_shared/models/project-detail.model';
import { environment } from '../../../../../common/env/environment';
import { ShareLinkTabComponent } from './share-link-tab/share-link-tab.component';
import { SharePeopleTabComponent } from './share-people-tab/share-people-tab.component';

@Component({
  selector: 'app-share-dialog',
  imports: [
    Drawer,
    SelectButton,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FormsModule,
    TranslatePipe,
    SharePeopleTabComponent,
    ShareLinkTabComponent,
  ],
  templateUrl: './share-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  readonly VisibilityType = VisibilityType;

  projectId = input.required<string>();
  projectName = input.required<string>();
  sharedWith = input.required<SharedWith[]>();
  visibilityType = input.required<VisibilityType>();
  visible = model(false);

  selectedVisibility = signal<VisibilityType>(
    VisibilityType.VisibleForSelectedOnly,
  );

  activeTab = signal('people');

  sharingContacts = this.projectStore.sharingContacts;
  sharingInProgress = this.projectStore.sharingInProgress;

  isPublic = computed(
    () => this.selectedVisibility() === VisibilityType.VisibleForEverybody,
  );

  constructor() {
    effect(() => {
      this.selectedVisibility.set(this.visibilityType());
    });
    effect(() => {
      if (this.visible()) {
        this.projectStore.loadContacts(this.projectId());
      }
    });
  }

  private inviteOnlyLabel = this.translateService.translate(
    'project.share.inviteOnly',
  );
  private openLabel = this.translateService.translate('project.share.open');

  visibilityOptions = computed(() => [
    {
      label: this.inviteOnlyLabel(),
      value: VisibilityType.VisibleForSelectedOnly,
    },
    { label: this.openLabel(), value: VisibilityType.VisibleForEverybody },
  ]);

  shareLink = computed(() => `${environment.baseUrl}/p/${this.projectId()}`);

  setActiveTab(value: string | number | undefined) {
    if (value !== undefined) {
      this.activeTab.set(String(value));
    }
  }

  onVisibilityChange(value: VisibilityType) {
    this.selectedVisibility.set(value);
    if (value === VisibilityType.VisibleForEverybody) {
      this.activeTab.set('link');
    }
    this.projectStore.updateVisibilityType({
      projectId: this.projectId(),
      type: value,
    });
  }
}
