import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AddCardComponent } from '../../../../common/ui/components/add-card/add-card.component';
import { OptionType } from '../../_shared/models/poll-detail.model';
import { PollListStore } from '../../_shared/data/poll-list.store';
import { PollItemComponent } from '../../_shared/ui/poll-item/poll-item.component';
import { PollItem } from '../../_shared/models/poll-item.model';

@Component({
  selector: 'app-standalone-poll-tab',
  imports: [TranslatePipe, PollItemComponent, AddCardComponent],
  templateUrl: './standalone-poll-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandalonePollTabComponent {
  private readonly projectListStore = inject(PollListStore);
  private readonly router = inject(Router);

  deletionRequested = output<PollItem>();
  shareRequested = output<string>();

  standalonePolls = computed(() =>
    this.projectListStore.standalonePolls().map((t) => ({
      ...t,
      optionType: t.optionType as OptionType,
    })),
  );

  navigateToAdd() {
    this.router.navigate(['/polls/add']);
  }
}
