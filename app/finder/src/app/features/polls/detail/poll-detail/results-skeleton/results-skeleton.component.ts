import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsPollCardSkeletonComponent } from '@ds/poll-card-skeleton/ds-poll-card-skeleton.component';

@Component({
    selector: 'app-results-skeleton',
    templateUrl: './results-skeleton.component.html',
    styleUrl: './results-skeleton.component.css',
    imports: [DsPollCardSkeletonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsSkeletonComponent {}
