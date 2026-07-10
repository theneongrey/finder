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
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ProjectStore } from '../../../_shared/data/project.store';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  SharedWith,
  VisibilityType,
} from '../../../_shared/models/project-detail.model';
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../../common/env/environment';

@Component({
  selector: 'app-share-dialog',
  imports: [
    Drawer,
    Button,
    InputText,
    Select,
    SelectButton,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FormsModule,
    TranslatePipe,
    Avatar,
    AvatarGroup,
    Tooltip,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './share-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);
  private readonly messageService = inject(MessageService);

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

  constructor() {
    effect(() => {
      this.selectedVisibility.set(this.visibilityType());
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

  private voterLabel = this.translateService.translate('project.roles.voter');
  private maintainerLabel = this.translateService.translate(
    'project.roles.maintainer',
  );
  private ownerLabel = this.translateService.translate('project.roles.owner');

  availablePermissions = computed(() => [
    { id: 0, name: this.voterLabel() },
    { id: 1, name: this.maintainerLabel() },
    { id: 2, name: this.ownerLabel() },
  ]);

  email = model('');
  selectedPermission = model(0);

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

  copyLink() {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      this.messageService.add({
        severity: 'success',
        detail: this.translateService.instant('project.share.linkCopied'),
        life: 3000,
      });
    });
  }

  share() {
    if (this.email()) {
      this.projectStore.share({
        email: this.email(),
        permissionType: this.selectedPermission(),
        projectId: this.projectId(),
      });
      this.visible.set(false);
    }
  }
}
