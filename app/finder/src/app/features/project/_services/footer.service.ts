import { Injectable, signal } from '@angular/core';
import { FooterButton } from './footer-button.model';

@Injectable({
  providedIn: 'root',
})
export class FooterService {
  public buttons = signal<FooterButton[]>([]);
  public title = signal<string | undefined>('');

  setButtons(buttons: FooterButton[]) {
    this.buttons.set(buttons);
  }

  setTitle(title: string | undefined) {
    this.title.set(title);
  }

  clearButtons() {
    this.buttons.set([]);
  }
}
