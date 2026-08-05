import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-login',
  template: '',
  styles: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'm-auto',
  },
})
export class LoginComponent {
  constructor() {}
}
