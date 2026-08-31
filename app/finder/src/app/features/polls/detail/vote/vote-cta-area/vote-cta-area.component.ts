import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsVoteButtonsComponent } from '@ds/vote-buttons/ds-vote-buttons.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { VoteCommentButtonComponent } from '../vote-comment-button/vote-comment-button.component';
import { OptionType } from '@common/models/option-type.model';

const RATING_LABEL_KEYS: Record<number, string> = {
    1: 'project.vote.ratingLabel.1',
    2: 'project.vote.ratingLabel.2',
    3: 'project.vote.ratingLabel.3',
    4: 'project.vote.ratingLabel.4',
    5: 'project.vote.ratingLabel.5',
};

@Component({
    selector: 'app-vote-cta-area',
    templateUrl: './vote-cta-area.component.html',
    styleUrl: './vote-cta-area.component.css',
    imports: [
        TranslatePipe,
        DsVoteButtonsComponent,
        DsButtonComponent,
        DsIconComponent,
        VoteCommentButtonComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCtaAreaComponent {
    readonly OptionType = OptionType;
    readonly ratingStars = [1, 2, 3, 4, 5];

    optionType = input(OptionType.YesNo);
    pollId = input('');
    optionId = input('');
    optionText = input<string | undefined>(undefined);

    yes = output<void>();
    no = output<void>();
    skip = output<void>();
    rated = output<number>();

    hoveredRatingStar = signal<number | undefined>(undefined);
    pendingRating = signal<number | undefined>(undefined);

    readonly displayedRating = computed(
        () => this.hoveredRatingStar() ?? this.pendingRating(),
    );

    readonly ratingLabelKey = computed(() => {
        const r = this.displayedRating();
        return r ? RATING_LABEL_KEYS[r] : 'project.vote.tapToRate';
    });

    readonly ratingLabelColor = computed(() =>
        this.displayedRating() ? 'var(--accent)' : 'var(--text-muted)',
    );

    constructor() {
        effect(() => {
            this.optionId();
            this.pendingRating.set(undefined);
            this.hoveredRatingStar.set(undefined);
        });
    }

    isStarFilled(star: number): boolean {
        const displayed = this.displayedRating();
        return displayed !== undefined && star <= displayed;
    }

    castRating(stars: number): void {
        this.pendingRating.set(stars);
        this.rated.emit(stars);
    }

    setHoveredStar(star: number): void {
        this.hoveredRatingStar.set(star);
    }

    clearHoveredStar(): void {
        this.hoveredRatingStar.set(undefined);
    }
}
