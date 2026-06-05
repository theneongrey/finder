import { inject, Injectable, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private router = inject(Router);

  // reset on navigation
  private _ = this.router.events
    .pipe(
      filter((e): e is NavigationStart => e instanceof NavigationStart),
      tap(() => this.#backRoute.set(undefined)),
    )
    .subscribe();

  #backRoute = signal<string | undefined>(undefined);
  backRoute = this.#backRoute.asReadonly();
  #title = signal<string>('Finder');
  title = this.#title.asReadonly();

  setBackroute(backRoute: string) {
    this.#backRoute.set(backRoute);
  }

  setTitle(title: string) {
    this.#title.set(title);
  }
}
