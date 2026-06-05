import { Pipe, PipeTransform } from '@angular/core';
import { OptionType } from '../../_models/project-detail.model';

@Pipe({
  name: 'topicByType',
})
export class TopicByTypePipe implements PipeTransform {
  transform(type: OptionType): string {
    switch (type) {
      case OptionType.YesNo:
        return 'SELECTION';
      case OptionType.Rating:
        return 'RATING';
      case OptionType.Date:
        return 'DATE';
      default:
        return 'UNKNOWN';
    }
  }
}
