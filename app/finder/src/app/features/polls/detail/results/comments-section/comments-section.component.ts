import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Comment } from '../../../_shared/models/poll-detail.model';
import { TimeSincePipe } from '../../../overview/_pipe/time-ago.pipe';
import { FormsModule } from '@angular/forms';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { User } from '../../../../../common/models/user.model';

@Component({
  selector: 'app-comments-section',
  templateUrl: './comments-section.component.html',
  imports: [
    HlmButton,
    TranslatePipe,
    TimeSincePipe,
    DatePipe,
    FormsModule,
    DsTextareaComponent,
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
    if (!content) {
      return;
    }

    this.addComment.emit(content);
    this.newCommentText = '';
  }

  onEnterKey(event: Event) {
    const kb = event as KeyboardEvent;
    if (!kb.shiftKey) {
      event.preventDefault();
      this.submitComment();
    }
  }

  quoteAsDate(quote: string): number | null {
    if (!/^\d+$/.test(quote)) {
      return null;
    }
    const ts = Number(quote);
    const minTs = new Date('2010-01-01').getTime();
    const maxTs = new Date('2100-01-01').getTime();
    if (ts >= minTs && ts <= maxTs) {
      return ts;
    }
    return null;
  }

  authorAsUser(author: Comment['author']): User {
    return {
      name: author.name,
      email: '',
      role: 'Free',
      isAuthenticated: true,
      language: 'en',
    };
  }
}
