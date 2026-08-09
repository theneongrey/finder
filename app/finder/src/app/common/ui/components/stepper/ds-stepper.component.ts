import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

@Component({
  selector: 'ds-stepper',
  imports: [DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div class="stepper">
      @for (step of steps(); track $index; let i = $index; let last = $last) {
        <div class="step">
          <div class="step__indicator"
            [class.step__indicator--done]="i < current() - 1"
            [class.step__indicator--active]="i === current() - 1">
            @if (i < current() - 1) {
              <ds-icon name="check" [size]="12" color="white" />
            } @else {
              <span class="step__number">{{ i + 1 }}</span>
            }
          </div>
          @if (step) {
            <span class="step__label"
              [class.step__label--active]="i === current() - 1"
              [class.step__label--done]="i < current() - 1">
              {{ step }}
            </span>
          }
        </div>
        @if (!last) {
          <div class="step__connector" [class.step__connector--done]="i < current() - 1"></div>
        }
      }
    </div>
  `,
  styles: [`
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .step__indicator {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--sand-400);
      background: var(--cream-100);
      transition: background var(--duration-fast), border-color var(--duration-fast);
    }
    .step__indicator--active {
      background: var(--accent);
      border-color: var(--accent);
    }
    .step__indicator--done {
      background: var(--accent);
      border-color: var(--accent);
    }
    .step__number {
      font-size: var(--fs-caption);
      font-weight: 700;
      font-family: var(--font-body);
      color: var(--ink-400);
      line-height: 1;
    }
    .step__indicator--active .step__number,
    .step__indicator--done .step__number {
      color: white;
    }
    .step__label {
      font-size: var(--fs-caption-sm);
      font-family: var(--font-body);
      color: var(--text-muted);
      white-space: nowrap;
    }
    .step__label--active { color: var(--accent); font-weight: 600; }
    .step__label--done   { color: var(--text-secondary); }
    .step__connector {
      flex: 1;
      height: 2px;
      background: var(--sand-400);
      margin: 0 6px;
      margin-bottom: 22px;
      transition: background var(--duration-fast);
    }
    .step__connector--done { background: var(--accent); }
  `],
})
export class DsStepperComponent {
  steps   = input.required<string[]>();
  current = input(1);
}
