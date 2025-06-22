import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserStore } from './common/data/user.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor() {
    const userStore = inject(UserStore);
    userStore.getUser();
  }
}
