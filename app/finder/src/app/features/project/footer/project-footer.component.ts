import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ShowOnSmallDirective } from '../../../common/ui/directives/show-on-small.directive';
import { FooterService } from '../_services/footer.service';

@Component({
  selector: 'app-project-footer',
  imports: [Button, RouterLink, ShowOnSmallDirective],
  templateUrl: './project-footer.component.html',
  styleUrl: './project-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFooterComponent {
  private footerService = inject(FooterService);
  buttons = this.footerService.buttons;
  title = this.footerService.title;
}
