import { inject, Injectable, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private router = inject(Router);

  resetOnNavigation = this.router.events
    .pipe(
      filter((e): e is NavigationStart => e instanceof NavigationStart),
      tap(() => this.#backRoute.set(undefined)),
    )
    .subscribe();
  #backRoute = signal<string | undefined>(undefined);
  backRoute = this.#backRoute.asReadonly();

  setBackroute(route: string) {
    this.#backRoute.set(route);
  }
}
