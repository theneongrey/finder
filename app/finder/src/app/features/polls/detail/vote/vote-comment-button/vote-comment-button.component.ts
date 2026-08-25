import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { PollDetailStore } from '../../../_shared/data/poll-detail.store';
import { POLL_LIMITS } from '../../../_shared/models/poll-limits';

@Component({
  selector: 'app-vote-comment-button',
  templateUrl: './vote-comment-button.component.html',
  imports: [
    DsButtonComponent,
    DsTextareaComponent,
    ...HlmPopoverImports,
    FormsModule,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCommentButtonComponent {
  protected readonly limits = POLL_LIMITS;
  private readonly projectDetailStore = inject(PollDetailStore);

  pollId = input('');
  optionText = input<string | undefined>(undefined);

  commentText = '';
  popoverOpen = signal<'open' | 'closed'>('closed');

  submitComment(): void {
    const content = this.commentText.trim();
    if (!content) {
      return;
    }
    this.projectDetailStore.addComment({
      pollId: this.pollId(),
      content,
      quote: this.optionText(),
    });
    this.commentText = '';
    this.popoverOpen.set('closed');
  }

  cancelComment(): void {
    this.commentText = '';
    this.popoverOpen.set('closed');
  }
}
