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
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsMenuComponent, MenuItem } from '@ds/menu/ds-menu.component';
import { AvatarUser } from '@smart/avatar-stack/avatar-stack.component';
import { POLL_LIMITS } from '../../../../_shared/models/poll-limits';
import {
    OptionDetail,
    SharedWith,
} from '../../../../_shared/models/poll-detail.model';
import * as voteTally from '../../../../_shared/utils/vote-tally.utils';
import { urlDomain } from '../../../../_shared/utils/url.utils';
import { OptionVotersComponent } from '../option-voters/option-voters.component';
import { OptionCardActionsComponent } from '../option-card-actions/option-card-actions.component';
import { SwipeVoteCardComponent } from '../swipe-vote-card/swipe-vote-card.component';

@Component({
    selector: 'app-option-card',
    templateUrl: './option-card.component.html',
    imports: [
        FormsModule,
        TranslatePipe,
        DsButtonComponent,
        DsCardComponent,
        DsInputComponent,
        DsTextareaComponent,
        DsIconComponent,
        DsMenuComponent,
        OptionVotersComponent,
        OptionCardActionsComponent,
        SwipeVoteCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
    private readonly translate = inject(TranslateService);

    option = input.required<OptionDetail>();
    members = input<SharedWith[]>([]);
    commentCount = input(0);
    isMostVoted = input(false);
    projectId = input('');
    pollId = input('');
    hideResults = input(false);
    /** Closed polls take no votes: inline voting, swiping and reset are disabled. */
    isClosed = input(false);
    pollType = input<'yesno' | 'rating'>('yesno');
    /** Whether the current user may edit/delete this option (Maintainer+); gates those menu items. */
    canManage = input(false);

    commentsClick = output<void>();
    vote = output<{ optionId: string; choice: string }>();
    saveEdit = output<{
        optionId: string;
        text: string;
        description: string;
    }>();
    deleteOption = output<{ optionId: string }>();
    // Edit-guard: announce when this option enters/leaves inline editing so remote updates to
    // it can be deferred while the user is typing.
    editStart = output<{ optionId: string }>();
    editEnd = output<{ optionId: string }>();

    protected readonly limits = POLL_LIMITS;

    protected readonly editing = signal(false);
    protected readonly deleteConfirm = signal(false);
    protected readonly editText = signal('');
    protected readonly editDescription = signal('');

    protected startEdit(): void {
        this.deleteConfirm.set(false);
        this.editText.set(this.option().text);
        this.editDescription.set(this.option().description ?? '');
        this.editing.set(true);
        this.editStart.emit({ optionId: this.option().id });
    }

    protected cancelEdit(): void {
        this.editing.set(false);
        this.editEnd.emit({ optionId: this.option().id });
    }

    protected confirmDelete(): void {
        this.deleteOption.emit({ optionId: this.option().id });
        this.deleteConfirm.set(false);
    }

    protected submitEdit(): void {
        const text = this.editText().trim();
        if (!text) {
            return;
        }
        this.saveEdit.emit({
            optionId: this.option().id,
            text,
            description: this.editDescription().trim(),
        });
        this.editing.set(false);
        this.editEnd.emit({ optionId: this.option().id });
    }

    /** Option carries only its title — no description, image or link. */
    readonly isTextOnly = computed(() => {
        const o = this.option();
        return !o.description && !o.meta?.imageUrl && !o.meta?.url;
    });

    readonly linkDomain = computed(() =>
        urlDomain(this.option().meta?.url ?? ''),
    );

    // ── Tally ───────────────────────────────────────────────────────
    readonly voteLine = computed(() => {
        const option = this.option();
        if (this.pollType() === 'rating') {
            const count = voteTally.ratingsCount(option);
            if (!count) {
                return this.translate.instant('project.results.noRatings');
            }
            return this.translate.instant('project.results.ratingsAvgLine', {
                count,
                avg: voteTally
                    .averageRating(option)
                    .toFixed(1)
                    .replace('.', ','),
            });
        }
        const yes = voteTally.yesVotes(option).length;
        const no = voteTally.noVotes(option).length;
        if (!yes && !no) {
            return this.translate.instant('project.results.noVotes');
        }
        return this.translate.instant('project.results.voteLineYesNo', {
            yes,
            no,
        });
    });

    /** Everyone but the creator, who is shown separately with a crown. */
    readonly avatarUsers = computed((): AvatarUser[] =>
        voteTally.avatarUsers(
            this.option(),
            this.members(),
            this.option().creator.name,
        ),
    );

    readonly creatorVoted = computed(() =>
        voteTally.personVoted(this.option(), this.option().creator.name),
    );

    // ── Menu ────────────────────────────────────────────────────────
    readonly menuItems = computed((): MenuItem[] => {
        const items: MenuItem[] = [];
        if (this.canManage()) {
            items.push({
                icon: 'edit',
                label: this.translate.instant('project.results.edit'),
                onClick: () => this.startEdit(),
            });
        }
        if (!this.isClosed() && voteTally.hasVoted(this.option().choice)) {
            items.push({
                icon: 'refresh',
                label: this.translate.instant('project.results.resetVote'),
                onClick: () => this.resetVote(),
            });
        }
        if (this.canManage()) {
            items.push({
                icon: 'trash',
                label: this.translate.instant('project.results.deleteOption'),
                danger: true,
                separatorBefore: true,
                onClick: () => this.deleteConfirm.set(true),
            });
        }
        return items;
    });

    // ── Voting ──────────────────────────────────────────────────────
    protected castVote(choice: string): void {
        this.vote.emit({ optionId: this.option().id, choice });
    }

    /** Swipe right = yes / five stars, left = no / one star — as in the vote overlay. */
    protected onSwiped(right: boolean): void {
        const isRating = this.pollType() === 'rating';
        this.castVote(isRating ? (right ? '5' : '1') : right ? '1' : '2');
    }

    private resetVote(): void {
        this.castVote(voteTally.resetChoice(this.option().choice));
    }

    protected openUrl(url: string) {
        window.open(url, '_blank', 'noopener noreferrer');
    }
}
