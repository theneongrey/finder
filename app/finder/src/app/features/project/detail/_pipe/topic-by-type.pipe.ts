import { Pipe, PipeTransform } from '@angular/core';
import { TopicType } from '../../_models/project-detail.model';

@Pipe({
  name: 'topicByType',
})
export class TopicByTypePipe implements PipeTransform {
  transform(type: TopicType): string {
    switch (type) {
      case 'selection':
        return 'SELECTION';
      case 'appointment':
        return 'APPOINTMENT';
      case 'rating':
        return 'RATING';
      default:
        return 'UNKNOWN';
    }
  }
}
