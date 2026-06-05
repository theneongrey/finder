import { Pipe, PipeTransform } from '@angular/core';
import { OptionType } from '../../_models/project-detail.model';

@Pipe({
  name: 'hierarchyByType',
})
export class HierarchyByTypePipe implements PipeTransform {
  transform(type: OptionType): 'primary' | 'secondary' | 'tertiary' {
    switch (type) {
      case OptionType.YesNo:
        return 'primary';
      case OptionType.Rating:
        return 'secondary';
      case OptionType.Date:
        return 'tertiary';
      default:
        return 'primary';
    }
  }
}
