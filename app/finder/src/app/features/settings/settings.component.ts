import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { UserStore } from '../../common/data/user.store';
import { form, required, FormRoot, FormField } from '@angular/forms/signals';
import { Button } from 'primeng/button';
import { Panel } from 'primeng/panel';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-settings',
  imports: [FormRoot, FormField, Button, Panel, InputText],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private userStore = inject(UserStore);

  protected model = signal({ name: '' });
  protected myForm = form(this.model, (p) => {
    required(p.name);
  });

  updateName() {
    if (this.myForm().valid()) {
      this.userStore.updateName(this.model().name);
    }
  }
}
