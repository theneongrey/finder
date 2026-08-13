import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DsIconComponent } from '../../common/ui/components/icon/icon.component';
import { DsButtonComponent } from '../../common/ui/components/button/button.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DsIconComponent, DsButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
