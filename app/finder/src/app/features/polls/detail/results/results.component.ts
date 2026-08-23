import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PollDetailStore } from '../../_shared/data/poll-detail.store';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { VoteOverviewSummaryComponent } from './vote-overview-summary/vote-overview-summary.component';
import { OptionListComponent } from './option-list/option-list.component';
import { CommentsSectionComponent } from './comments-section/comments-section.component';
import { VoteMatrixComponent } from './vote-matrix/vote-matrix.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsBadgeComponent } from '@ds/badge/ds-badge.component';
import { DsStatusDotComponent } from '@ds/badge/ds-status-dot.component';
import { DsTabsComponent, TabItem } from '@ds/tabs/ds-tabs.component';
import { PollRole } from '../../_shared/models/poll-role.enum';
import { OptionType } from '../../_shared/models/poll-detail.model';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  imports: [
    TranslatePipe,
    VoteOverviewSummaryComponent,
    OptionListComponent,
    CommentsSectionComponent,
    VoteMatrixComponent,
    DsButtonComponent,
    DsBadgeComponent,
    DsStatusDotComponent,
    DsTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
  private readonly projectDetailStore = inject(PollDetailStore);

  readonly OptionType = OptionType;

  pollId = input('');

  poll = this.projectDetailStore.currentPoll;
  project = this.projectDetailStore.currentProject;

  view = signal<'results' | 'comments'>('results');

  readonly tabItems = computed((): TabItem[] => [
    { value: 'results',  label: 'Ergebnis' },
    { value: 'comments', label: 'Kommentare', count: this.poll()?.comments.length },
  ]);
  showCloseConfirm = signal(false);

  canManagePoll = computed(() => {
    const project = this.project();
    const poll = this.poll();
    return (
      project !== undefined &&
      poll !== undefined &&
      project.role >= PollRole.Maintainer
    );
  });

  readonly typeLabel = computed(() => {
    switch (this.poll()?.optionType) {
      case OptionType.Rating: return 'Bewertung';
      case OptionType.Date:   return 'Terminumfrage';
      default:                return 'Ja / Nein';
    }
  });

  readonly statusLabel = computed(() => this.poll()?.isClosed ? 'Beendet' : 'Aktiv');
  readonly statusBg    = computed(() => this.poll()?.isClosed ? '#f1eee9' : '#e2ede1');
  readonly statusFg    = computed(() => this.poll()?.isClosed ? '#6f6b66' : '#3f7a4e');
  readonly statusDot   = computed(() => this.poll()?.isClosed ? '#b5b0a8' : '#5d9a56');
  readonly statusPulse = computed(() => !this.poll()?.isClosed);

  readonly commentsWithContext = computed(() => {
    const poll = this.poll();
    if (!poll) { return 0; }
    return poll.comments.filter(c => !!c.quote).length;
  });

  readonly totalMembers = computed(() => this.project()?.sharedWith.length ?? 0);

  readonly deadlineText = computed(() => {
    const poll = this.poll();
    if (!poll) { return ''; }
    if (poll.isClosed) { return 'Beendet'; }
    if (!poll.closeDate) { return ''; }
    const d = new Date(poll.closeDate);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0)  { return 'Endet heute'; }
    if (diffDays === 1) { return 'Endet morgen'; }
    if (diffDays <= 7)  { return `Endet in ${diffDays} Tagen`; }
    return `Endet am ${d.toLocaleDateString('de', { day: 'numeric', month: 'short' })}`;
  });

  constructor() {
    const titleService = inject(TitleBarService);
    const translateService = inject(TranslateService);

    effect(() => {
      this.projectDetailStore.getPoll(this.pollId());
    });

    effect(() => {
      const poll = this.poll();
      if (poll) {
        titleService.setTitle(poll.name);
      }
    });

    effect(() => {
      const project = this.project();
      if (project) {
        titleService.setBackRoute('/polls');
      }
    });

    translateService
      .stream('project.pollsTab.title')
      .pipe(takeUntilDestroyed())
      .subscribe((label: string) => {
        titleService.setSubtitle(label);
      });
  }

  addComment(content: string) {
    this.projectDetailStore.addComment({ pollId: this.pollId(), content });
  }

  closePoll() {
    this.projectDetailStore.closePoll(this.pollId());
    this.showCloseConfirm.set(false);
  }

  reopenPoll() {
    this.projectDetailStore.reopenPoll(this.pollId());
  }
}
