import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStore } from '../../../_data/project.store';
import { PollItemComponent } from '../../../poll-item/poll-item.component';
import { PollItem } from '../../../poll-item/poll-item.model';
import { AddCardComponent } from '../../../../../common/ui/components/add-card/add-card.component';
import { OptionType } from '../../../_models/project-detail.model';

@Component({
  selector: 'app-topics-tab',
  imports: [TranslatePipe, PollItemComponent, AddCardComponent],
  templateUrl: './topics-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsTabComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);

  deletionRequested = output<PollItem>();

  standalonePolls = computed(() =>
    this.projectStore.standalonePolls().map((t) => ({
      ...t,
      optionType: t.optionType as OptionType,
    })),
  );

  navigateToAdd() {
    this.router.navigate(['/project/add-standalone']);
  }
}
