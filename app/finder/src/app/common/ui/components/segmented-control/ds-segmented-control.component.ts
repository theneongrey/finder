import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ds-segmented-control',
  imports: [...HlmToggleGroupImports],
  templateUrl: './ds-segmented-control.component.html',
  styleUrl: './ds-segmented-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsSegmentedControlComponent {
  options = input.required<SegmentOption[]>();
  value = model.required<string>();
  size = input<'sm' | 'md'>('md');

  protected onValueChange(v: string | string[] | null | undefined): void {
    if (typeof v === 'string') this.value.set(v);
  }
}
