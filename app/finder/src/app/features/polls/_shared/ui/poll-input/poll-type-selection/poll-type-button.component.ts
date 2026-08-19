import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { OptionType } from '../../../models/poll-detail.model';

@Component({
  selector: 'app-poll-type-button',
  templateUrl: './poll-type-button.component.html',
  styleUrl: './poll-type-button.component.css',
  imports: [TranslatePipe, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollTypeButtonComponent {
  type = input.required<OptionType>();
  selectedType = input<OptionType | undefined>(undefined);
  layout = input<'list' | 'grid'>('list');
  iconName = input.required<string>();
  nameKey = input.required<string>();
  descKey = input.required<string>();
  testId = input.required<string>();

  typeSelected = output<OptionType>();

  protected readonly isSelected = computed(() => this.selectedType() === this.type());
  protected readonly btnClass = computed(() => {
    let cls = 'type-btn';
    if (this.isSelected()) cls += ' type-btn--selected';
    if (this.layout() === 'grid') cls += ' type-btn--grid';
    return cls;
  });
}
