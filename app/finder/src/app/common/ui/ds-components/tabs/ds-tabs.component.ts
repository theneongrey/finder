import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'ds-tabs',
  imports: [...HlmTabsImports],
  templateUrl: './ds-tabs.component.html',
  styleUrl: './ds-tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsTabsComponent {
  items = input.required<TabItem[]>();
  value = model.required<string>();
  size = input<'sm' | 'md'>('md');
}
