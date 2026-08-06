import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionType } from '../../models/project-detail.model';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { OptionTypeIconComponent } from './option-type-icon/option-type-icon.component';
import { PollItem } from '../../models/poll-item.model';
import { ProjectRole } from '../../models/project-role.enum';

@Component({
  selector: 'app-poll-item',
  imports: [
    HlmButton,
    ...HlmDropdownMenuImports,
    ...HlmTooltipImports,
    OptionTypeIconComponent,
    RouterLink,
    TranslatePipe,
    ...HlmCardImports,
  ],
  templateUrl: './poll-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
  private readonly translateService = inject(TranslateService);

  poll = input.required<PollItem>();
  standalone = input(false);
  deletionRequested = output();
  shareRequested = output();

  editLabel = this.translateService.translate('project.common.edit');
  deleteLabel = this.translateService.translate('project.common.delete');
  shareLabel = this.translateService.translate('project.common.share');

  showMenu = computed(() => this.poll().role >= ProjectRole.Maintainer);
  canSharePoll = computed(() => this.standalone() && this.poll().role >= ProjectRole.Owner);

  editRoute = computed(() => {
    const poll = this.poll();
    if (poll.optionType === OptionType.YesNo) {
      return ['/project/detail', poll.projectId, 'poll', 'edit', 'yesno', poll.pollId];
    }
    if (poll.optionType === OptionType.Date) {
      return ['/project/detail', poll.projectId, 'poll', 'edit', 'date', poll.pollId];
    }
    return null;
  });
}
