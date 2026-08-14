import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { DsIconComponent } from '../icon/ds-icon.component';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'ds-segmented-control',
  imports: [...HlmToggleGroupImports, DsIconComponent],
  templateUrl: './ds-segmented-control.component.html',
  styleUrl: './ds-segmented-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsSegmentedControlComponent {
  options = input.required<SegmentOption[]>();
  value = model.required<string>();
  size = input<'sm' | 'md'>('md');

  protected readonly pillIndex = computed(() => {
    const idx = this.options().findIndex(o => o.value === this.value());
    return Math.max(0, idx);
  });

  protected readonly pillStyle = computed(() => ({
    '--pill-index': this.pillIndex(),
    '--pill-count': this.options().length,
  }));

  protected onValueChange(v: string | string[] | null | undefined): void {
    if (typeof v === 'string') { this.value.set(v); }
  }
}
