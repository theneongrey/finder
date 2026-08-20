import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OptionType } from '../../_shared/models/poll-detail.model';
import { PollListStore } from '../../_shared/data/poll-list.store';
import { PollItemComponent } from '../../_shared/ui/poll-item/poll-item.component';
import { PollItem } from '../../_shared/models/poll-item.model';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsPollCardSkeletonComponent } from '@ds/poll-card-skeleton/ds-poll-card-skeleton.component';
import { DsSubHeaderComponent } from '@ds/sub-header/ds-sub-header.component';

@Component({
  selector: 'app-standalone-poll-tab',
  imports: [TranslatePipe, PollItemComponent, DsIconComponent, DsButtonComponent, RouterLink, DsPollCardSkeletonComponent, DsSubHeaderComponent],
  templateUrl: './standalone-poll-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandalonePollTabComponent {
  protected readonly projectListStore = inject(PollListStore);

  deletionRequested = output<PollItem>();
  shareRequested = output<string>();

  readonly query = signal('');
  readonly showOpen = signal(true);
  readonly showClosed = signal(true);
  readonly favOnly = signal(false);
  readonly todoOnly = signal(false);
  readonly editMode = signal(false);

  constructor() {
    inject(BreakpointObserver)
      .observe('(min-width: 680px)')
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        if (matches) { this.editMode.set(false); }
      });
  }

  private readonly allPolls = computed(() =>
    this.projectListStore.standalonePolls().map(t => ({
      ...t,
      optionType: t.optionType as OptionType,
    })),
  );

  readonly openCount   = computed(() => this.allPolls().filter(p => !p.isClosed).length);
  readonly closedCount = computed(() => this.allPolls().filter(p => p.isClosed).length);
  readonly todoCount   = computed(() => this.allPolls().filter(p => !p.isClosed && !p.currentUserVoted).length);

  readonly isDirty = computed(
    () => !this.showOpen() || !this.showClosed() || this.favOnly() || this.todoOnly() || !!this.query().trim(),
  );

  readonly filteredPolls = computed(() => {
    let polls = this.allPolls();

    if (!this.showOpen()) { polls = polls.filter(p => p.isClosed); }
    if (!this.showClosed()) { polls = polls.filter(p => !p.isClosed); }
    if (this.favOnly()) { polls = polls.filter(p => p.isFavorite); }
    if (this.todoOnly()) { polls = polls.filter(p => !p.isClosed && !p.currentUserVoted); }

    const q = this.query().trim().toLowerCase();
    if (q) {
      polls = polls.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }

    return polls.slice().sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  });

  readonly isLoading = this.projectListStore.isLoading;
  readonly isEmpty = computed(() => this.allPolls().length === 0);
  readonly isFilteredEmpty = computed(() => !this.isEmpty() && this.filteredPolls().length === 0);

  toggleEditMode(): void {
    this.editMode.update(v => !v);
  }

  clearQuery(): void {
    this.query.set('');
  }

  resetFilters(): void {
    this.query.set('');
    this.showOpen.set(true);
    this.showClosed.set(true);
    this.favOnly.set(false);
    this.todoOnly.set(false);
  }

  reload(): void {
    this.projectListStore.getStandalonePolls();
  }
}
