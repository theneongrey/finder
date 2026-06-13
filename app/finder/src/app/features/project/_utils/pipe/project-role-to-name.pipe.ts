import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProjectRole } from '../../_models/project-role.enum';

@Pipe({
  name: 'projectRoleToName',
  pure: false,
})
export class ProjectRoleToNamePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);

  transform(role: ProjectRole): string {
    this.translateService.currentLang();

    switch (role) {
      case ProjectRole.Voter:
        return this.translateService.instant('project.roles.voter');
      case ProjectRole.Maintainer:
        return this.translateService.instant('project.roles.maintainer');
      case ProjectRole.Owner:
        return this.translateService.instant('project.roles.owner');
      case ProjectRole.Creator:
        return this.translateService.instant('project.roles.creator');
    }

    return this.translateService.instant('project.roles.unknown');
  }
}
