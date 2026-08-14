import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ds-poll-card-skeleton',
  templateUrl: './ds-poll-card-skeleton.component.html',
  styleUrl: './ds-poll-card-skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsPollCardSkeletonComponent {
  count = input(3);
  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
