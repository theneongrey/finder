import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Comment } from '../../_models/project-detail.model';
import { TimeSincePipe } from '../../overview/_pipe/time-ago.pipe';

@Component({
  selector: 'app-comments-section',
  templateUrl: './comments-section.component.html',
  styleUrl: './comments-section.component.css',
  imports: [InputGroup, InputText, Button, TranslatePipe, FormsModule, TimeSincePipe],
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

  initials(author: string): string {
    return author
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }
}
