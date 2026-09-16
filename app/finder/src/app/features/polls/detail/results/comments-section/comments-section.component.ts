import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Comment } from '../../../_shared/models/poll-detail.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { POLL_LIMITS } from '../../../_shared/models/poll-limits';
import { TimeSincePipe } from '@common/ui/pipes/time-ago.pipe';

@Component({
    selector: 'app-comments-section',
    templateUrl: './comments-section.component.html',
    imports: [
        FormsModule,
        TranslatePipe,
        TimeSincePipe,
        DsButtonComponent,
        DsTextareaComponent,
        UserAvatarComponent,
    ],
    styles: [
        `
            /* Match the resting textarea height to the 44px send button */
            :host ::ng-deep .comment-input .ds-ta {
                min-height: 44px;
                padding-top: 12px;
                padding-bottom: 12px;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsSectionComponent {
    protected readonly limits = POLL_LIMITS;
    comments = input<Comment[]>([]);
    addComment = output<string>();
    dismiss = output<void>();

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

    authorUser(author: Comment['author']): { name: string } {
        return { name: author.name };
    }
}
