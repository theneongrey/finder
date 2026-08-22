import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-auth-step-indicator',
  templateUrl: './auth-step-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex gap-[7px] mb-[16px]' },
})
export class AuthStepIndicatorComponent {
  step = input.required<1 | 2 | 3>();

  protected dot2Class = computed(() =>
    this.step() >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--sand-200)]',
  );
  protected dot3Class = computed(() =>
    this.step() === 3 ? 'bg-[#5d9a56]' : 'bg-[var(--sand-200)]',
  );
}
