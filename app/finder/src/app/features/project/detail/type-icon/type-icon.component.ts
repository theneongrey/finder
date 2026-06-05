import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OptionType } from '../../_models/project-detail.model';

@Component({
  selector: 'app-topic-type-icon',
  imports: [],
  templateUrl: './type-icon.component.html',
  styleUrl: './type-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeIconComponent {
  type = input.required<OptionType>();
  readonly OptionType = OptionType;
}
