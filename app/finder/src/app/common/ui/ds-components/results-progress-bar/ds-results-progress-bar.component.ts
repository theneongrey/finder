import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ProgressSegment {
  percent: number;
  color: string;
}

@Component({
  selector: 'ds-results-progress-bar',
  templateUrl: './ds-results-progress-bar.component.html',
  styleUrl: './ds-results-progress-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block; width: 100%;' },
})
export class DsResultsProgressBarComponent {
  segments = input.required<ProgressSegment[]>();
  height = input<number>(8);
}
