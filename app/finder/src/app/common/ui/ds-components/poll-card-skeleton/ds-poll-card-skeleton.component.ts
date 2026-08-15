import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const WIDTHS = [
  { w1: '78%', w2: '62%' },
  { w1: '64%', w2: '71%' },
  { w1: '82%', w2: '55%' },
  { w1: '70%', w2: '66%' },
];

@Component({
  selector: 'ds-poll-card-skeleton',
  templateUrl: './ds-poll-card-skeleton.component.html',
  styleUrl: './ds-poll-card-skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsPollCardSkeletonComponent {
  count = input(3);
  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, i) => WIDTHS[i % WIDTHS.length]),
  );
}
