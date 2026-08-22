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
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { PollRole } from '../../_shared/models/poll-role.enum';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  imports: [
    TranslatePipe,
    VoteOverviewSummaryComponent,
    OptionListComponent,
    CommentsSectionComponent,
    DsButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent {
  private readonly projectDetailStore = inject(PollDetailStore);

  pollId = input('');

  poll = this.projectDetailStore.currentPoll;
  project = this.projectDetailStore.currentProject;

  view = signal<'results' | 'comments'>('results');
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
