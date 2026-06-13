import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Panel } from 'primeng/panel';

@Component({
  selector: 'app-auth-form-panel',
  imports: [ReactiveFormsModule, Panel],
  templateUrl: './auth-form-panel.component.html',
  styleUrl: './auth-form-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFormPanelComponent {
  form = input.required<FormGroup>();
}
