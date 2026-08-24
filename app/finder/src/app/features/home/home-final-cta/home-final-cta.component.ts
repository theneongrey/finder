import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-final-cta',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home-final-cta.component.html',
  styleUrl: './home-final-cta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFinalCtaComponent {}
