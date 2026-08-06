import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { TimeSincePipe } from '../_pipe/time-ago.pipe';
import { Button } from 'primeng/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectOverview } from '../../_shared/models/project-overview.model';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { ProjectRole } from '../../_shared/models/project-role.enum';

@Component({
  selector: 'app-project-item',
  imports: [
    RouterLink,
    FormsModule,
    HlmBadge,
    ...HlmDropdownMenuImports,
    TimeSincePipe,
    Button,
    TranslatePipe,
    ...HlmCardImports,
  ],
  templateUrl: './project-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectItemComponent {
  private readonly translateService = inject(TranslateService);

  project = input.required<ProjectOverview>();
  canEdit = computed(() => this.project().role >= ProjectRole.Maintainer);
  canShare = computed(() => this.project().role >= ProjectRole.Owner);
  deletionRequested = output();
  shareRequested = output();

  editLabel = this.translateService.translate('project.common.edit');
  deleteLabel = this.translateService.translate('project.common.delete');
  shareLabel = this.translateService.translate('project.common.share');
}
