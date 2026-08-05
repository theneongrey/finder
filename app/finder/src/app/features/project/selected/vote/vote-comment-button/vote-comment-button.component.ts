import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { Popover } from 'primeng/popover';
import { ProjectDetailStore } from '../../../_shared/data/project-detail.store';

@Component({
  selector: 'app-vote-comment-button',
  templateUrl: './vote-comment-button.component.html',
  imports: [Button, Popover, HlmInput, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCommentButtonComponent {
  private readonly projectDetailStore = inject(ProjectDetailStore);

  pollId = input('');
  optionText = input<string | undefined>(undefined);

  commentPopover = viewChild<Popover>('commentPopover');
  anchor = viewChild<ElementRef<HTMLElement>>('anchor');
  commentText = '';

  openCommentPopover(event: Event): void {
    this.commentPopover()?.toggle(event, this.anchor()?.nativeElement);
  }

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
    this.commentPopover()?.hide();
  }

  cancelComment(): void {
    this.commentText = '';
    this.commentPopover()?.hide();
  }
}
