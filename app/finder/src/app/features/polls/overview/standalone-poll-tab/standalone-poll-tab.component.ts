import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../_shared/models/poll-detail.model';
import { PollListStore } from '../../_shared/data/poll-list.store';
import { PollItemComponent } from '../../_shared/ui/poll-item/poll-item.component';
import { PollItem } from '../../_shared/models/poll-item.model';

@Component({
  selector: 'app-standalone-poll-tab',
  imports: [TranslatePipe, PollItemComponent],
  templateUrl: './standalone-poll-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandalonePollTabComponent {
  protected readonly projectListStore = inject(PollListStore);

  deletionRequested = output<PollItem>();
  shareRequested = output<string>();

  standalonePolls = computed(() =>
    this.projectListStore.standalonePolls().map((t) => ({
      ...t,
      optionType: t.optionType as OptionType,
    })),
  );
}
