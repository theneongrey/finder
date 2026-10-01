import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';

/** Bottom action row of an option card: discuss button plus inline Yes/No or star voting. */
@Component({
    selector: 'app-option-card-actions',
    templateUrl: './option-card-actions.component.html',
    imports: [TranslatePipe, DsButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardActionsComponent {
    mode = input<'yesno' | 'rating'>('yesno');
    /** The current user's choice on this option ('1' yes, '2' no, '1'–'5' stars, ≤ 0 none). */
    choice = input<string | null>(null);
    commentCount = input(0);
    /** Voting is off (poll closed); discussing still works. */
    disabled = input(false);

    vote = output<string>();
    commentsClick = output<void>();

    protected readonly stars = [1, 2, 3, 4, 5];
    protected readonly hoveredStar = signal<number | undefined>(undefined);

    private readonly choiceValue = computed(
        () => parseInt(this.choice() ?? '0') || 0,
    );
    protected readonly isYes = computed(() => this.choice() === '1');
    protected readonly isNo = computed(() => this.choice() === '2');
    protected readonly rating = computed(() => Math.max(this.choiceValue(), 0));

    protected isStarFilled(star: number): boolean {
        return star <= (this.hoveredStar() ?? this.rating());
    }
}
