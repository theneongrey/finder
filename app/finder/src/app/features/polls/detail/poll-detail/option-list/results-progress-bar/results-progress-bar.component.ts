import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ProgressSegment {
    percent: number;
    color: string;
}

@Component({
    selector: 'app-results-progress-bar',
    templateUrl: './results-progress-bar.component.html',
    styleUrl: './results-progress-bar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: block; width: 100%;' },
})
export class ResultsProgressBarComponent {
    segments = input.required<ProgressSegment[]>();
    height = input<number>(8);
}
