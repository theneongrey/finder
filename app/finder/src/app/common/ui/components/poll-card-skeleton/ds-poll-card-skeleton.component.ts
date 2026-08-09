import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ds-poll-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @for (i of items(); track i) {
      <div class="card">
        <div class="row">
          <div class="bar" style="width: 104px; height: 20px"></div>
          <div class="bar" style="width: 56px; height: 16px"></div>
        </div>
        <div class="bar" style="width: 68%; height: 22px; margin-top: 14px"></div>
        <div class="bar bar--light" style="width: 48%; height: 13px; margin-top: 9px"></div>
        <div class="track" style="margin-top: 18px"></div>
      </div>
    }
  `,
  styles: [`
    .card {
      background: #fff;
      border: 1px solid rgba(20, 24, 28, 0.055);
      border-radius: var(--radius-3xl);
      padding: 18px 20px 20px;
      box-shadow: var(--shadow-card-soft);
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bar {
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--cream-300) 0%, var(--cream-200) 45%, var(--cream-300) 90%);
      background-size: 200% 100%;
      animation: ds-skeleton-shimmer 1.25s linear infinite;
    }
    .bar--light {
      background: linear-gradient(90deg, var(--cream-200) 0%, var(--cream-100) 45%, var(--cream-200) 90%);
      background-size: 200% 100%;
    }
    .track {
      height: 6px;
      width: 100%;
      border-radius: var(--radius-pill);
      background: var(--cream-300);
    }
    @keyframes ds-skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class DsPollCardSkeletonComponent {
  count = input(3);
  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
