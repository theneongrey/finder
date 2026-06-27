import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Comment } from '../../../_models/project-detail.model';
import { TimeSincePipe } from '../../../overview/_pipe/time-ago.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comments-section',
  templateUrl: './comments-section.component.html',
  imports: [
    InputGroup,
    InputText,
    Button,
    TranslatePipe,
    TimeSincePipe,
    DatePipe,
    FormsModule,
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

  initials(author: string): string {
    return author
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }
}
