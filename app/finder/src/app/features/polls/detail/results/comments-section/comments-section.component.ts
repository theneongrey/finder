import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../../_shared/models/poll-detail.model';
import { TimeSincePipe } from '../../../overview/_pipe/time-ago.pipe';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';

@Component({
  selector: 'app-comments-section',
  templateUrl: './comments-section.component.html',
  imports: [
    FormsModule,
    TimeSincePipe,
    DsButtonComponent,
    DsInputComponent,
    UserAvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsSectionComponent {
  comments = input<Comment[]>([]);
  addComment = output<string>();

  newCommentText = '';

  submitComment() {
    const content = this.newCommentText.trim();
    if (!content) { return; }
    this.addComment.emit(content);
    this.newCommentText = '';
  }

  onEnterKey(event: Event) {
    event.preventDefault();
    this.submitComment();
  }

  authorUser(author: Comment['author']): { name: string } {
    return { name: author.name };
  }
}
