import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Comment } from '../../../_shared/models/poll-detail.model';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import {
    DsSegmentedControlComponent,
    SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { POLL_LIMITS } from '../../../_shared/models/poll-limits';
import { TimeSincePipe } from '@common/ui/pipes/time-ago.pipe';

type CommentFilter = 'poll' | 'all';

@Component({
    selector: 'app-comments-section',
    templateUrl: './comments-section.component.html',
    styleUrl: './comments-section.component.css',
    host: { class: 'block h-full' },
    imports: [
        FormsModule,
        TranslatePipe,
        TimeSincePipe,
        DsButtonComponent,
        DsTextareaComponent,
        DsSegmentedControlComponent,
        UserAvatarComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsSectionComponent {
    private readonly translateService = inject(TranslateService);

    protected readonly limits = POLL_LIMITS;
    comments = input<Comment[]>([]);
    /** When set, the drawer is scoped to a single option and shows its title. */
    optionTitle = input<string | undefined>(undefined);
    submitting = input<boolean>(false);
    addComment = output<string>();
    dismiss = output<void>();

    newCommentText = '';

    /** Poll-level view: filter between poll-only and all comments. */
    filter = signal<CommentFilter>('poll');

    private readonly pollLabel = this.translateService.translate(
        'project.results.commentsFilterPoll',
    );
    private readonly allLabel = this.translateService.translate(
        'project.results.commentsFilterAll',
    );

    filterOptions = computed<SegmentOption[]>(() => [
        { value: 'poll', label: this.pollLabel() },
        { value: 'all', label: this.allLabel() },
    ]);

    /**
     * The poll/all filter only makes sense when there are option-scoped
     * comments to reveal; otherwise both tabs show the same list.
     */
    readonly hasOptionComments = computed(() =>
        this.comments().some((c) => c.optionId),
    );

    /** Comments to render: scoped to an option, or filtered at poll level. */
    visibleComments = computed<Comment[]>(() => {
        if (this.optionTitle() !== undefined) {
            return this.comments();
        }
        if (this.filter() === 'poll') {
            return this.comments().filter((c) => !c.optionId);
        }
        return this.comments();
    });

    onFilterChange(value: string) {
        this.filter.set(value as CommentFilter);
    }

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
