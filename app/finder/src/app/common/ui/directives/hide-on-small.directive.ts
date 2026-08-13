import { computed, Directive } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Directive({
  selector: '[fHideOnSmall]',
  standalone: true,
  host: {
    '[hidden]': 'isSmallScreen()',
  },
})
export class HideOnSmallDirective {
  private screenWidth = toSignal(
    fromEvent(window, 'resize').pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth),
    ),
    { initialValue: window.innerWidth },
  );

  protected isSmallScreen = computed(() => this.screenWidth() < 680);
}
