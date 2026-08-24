import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-footer',
  imports: [TranslatePipe],
  templateUrl: './home-footer.component.html',
  styleUrl: './home-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFooterComponent {}
