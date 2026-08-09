import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ds-progress-bar',
  template: `
    <div class="ds-progress-track" [style.height.px]="height()">
      <div class="ds-progress-fill" [style.width]="clamped() + '%'" [style.height.px]="height()"></div>
    </div>
  `,
  styles: [`
    .ds-progress-track {
      width: 100%;
      background: var(--cream-300);
      border-radius: 999px;
      overflow: hidden;
    }
    .ds-progress-fill {
      background: var(--accent);
      border-radius: 999px;
      transition: width var(--duration-standard) var(--ease-standard);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block; width: 100%;' },
})
export class DsProgressBarComponent {
  percent = input.required<number>();
  height = input<number>(9);

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.percent())));
}
