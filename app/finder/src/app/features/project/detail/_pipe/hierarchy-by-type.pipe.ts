import { Pipe, PipeTransform } from '@angular/core';
import { TopicType } from '../../_models/project-detail.model';

@Pipe({
  name: 'hierarchyByType',
})
export class HierarchyByTypePipe implements PipeTransform {
  transform(type: TopicType): 'primary' | 'secondary' | 'tertiary' {
    switch (type) {
      case 'selection':
        return 'primary';
      case 'appointment':
        return 'secondary';
      case 'rating':
        return 'tertiary';
      default:
        return 'primary';
    }
  }
}
