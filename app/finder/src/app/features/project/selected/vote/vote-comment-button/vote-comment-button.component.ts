import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { ProjectDetailStore } from '../../../_shared/data/project-detail.store';

@Component({
  selector: 'app-vote-comment-button',
  templateUrl: './vote-comment-button.component.html',
  imports: [Button, ...HlmPopoverImports, HlmInput, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCommentButtonComponent {
  private readonly projectDetailStore = inject(ProjectDetailStore);

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
