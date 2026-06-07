import { Pipe, PipeTransform } from '@angular/core';
import { ProjectRole } from '../../_models/project-role.enum';

@Pipe({
  name: 'projectRoleToName',
})
export class ProjectRoleToNamePipe implements PipeTransform {
  transform(role: ProjectRole): unknown {
    switch (role) {
      case ProjectRole.Voter:
        return 'Voter';
      case ProjectRole.Maintainer:
        return 'Maintainer';
      case ProjectRole.Owner:
        return 'Owner';
      case ProjectRole.Creator:
        return 'Creator';
    }

    return 'Unknown';
  }
}
