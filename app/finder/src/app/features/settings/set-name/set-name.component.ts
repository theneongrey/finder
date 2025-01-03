import { Component, effect, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Panel } from 'primeng/panel';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-settings-set-name',
  imports: [ReactiveFormsModule, Button, Panel, FloatLabel, InputText],
  templateUrl: './set-name.component.html',
  styleUrl: './set-name.component.css',
})
export class SetNameComponent {
  private userStore = inject(UserStore);

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  constructor(router: Router) {
    effect(() => {
      if (this.userStore.user()?.name) {
        router.navigate(['/']);
      }
    });
  }

  updateName() {
    if (this.form.valid) {
      this.userStore.updateName(this.form.get('name')!.value!);
    }
  }
}
