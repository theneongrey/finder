import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ds-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div class="stepper">
      @for (bar of bars(); track $index) {
        <span class="stepper__bar" [style.background]="bar"></span>
      }
    </div>
  `,
  styles: [`
    .stepper {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .stepper__bar {
      height: 4px;
      flex: 1;
      border-radius: 99px;
      transition: background 260ms ease;
    }
  `],
})
export class DsStepperComponent {
  steps   = input.required<number>();
  current = input(1);

  protected readonly bars = computed(() => {
    const n   = this.steps();
    const cur = this.current();
    return Array.from({ length: n }, (_, i) => {
      if (i < cur - 1) return 'var(--accent)';
      if (i === cur - 1) return 'var(--accent)';
      return 'var(--cream-400)';
    });
  });
}
