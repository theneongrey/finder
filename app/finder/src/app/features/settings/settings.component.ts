import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { UserStore } from '../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Select } from 'primeng/select';
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { UserAvatarComponent } from '../../common/ui/components/user-avatar/user-avatar.component';
import { TitleService } from '../../common/services/title.service';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    Button,
    InputText,
    InputGroup,
    InputGroupAddon,
    Select,
    TitleBarComponent,
    UserAvatarComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private userStore = inject(UserStore);

  user = this.userStore.user;

  languages = [
    { label: 'English', value: 'en' },
    { label: 'Deutsch', value: 'de' },
  ];

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl({ value: '', disabled: true }),
    language: new FormControl('en'),
  });

  constructor() {
    const titleService = inject(TitleService);
    const router = inject(Router);

    titleService.setTitle('Settings');

    const previousUrl =
      router.getCurrentNavigation()?.previousNavigation?.finalUrl;
    titleService.setBackroute(
      previousUrl ? router.serializeUrl(previousUrl) : '/',
    );

    effect(() => {
      const user = this.user();
      if (user) {
        this.form.patchValue({ name: user.name, email: user.email });
      }
    });
  }

  save() {
    if (this.form.valid) {
      this.userStore.updateName(this.form.controls.name.value ?? '');
    }
  }
}
