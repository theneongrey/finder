import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  #title = signal<string | undefined>(undefined);
  title = this.#title.asReadonly();
  #titleDisabled = signal<boolean>(false);
  titleDisabled = this.#titleDisabled.asReadonly();
  #backRoute = signal<string | undefined>(undefined);
  backRoute = this.#backRoute.asReadonly();
  #isHidden = signal<boolean>(false);
  isHidden = this.#isHidden.asReadonly();

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        tap(() => {
          this.#title.set(undefined);
          this.#titleDisabled.set(false);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        tap(() => {
          const snapshot = this.getDeepestSnapshot();
          const backRouteDef = snapshot.data['backRoute'];
          this.#backRoute.set(
            typeof backRouteDef === 'function'
              ? backRouteDef(snapshot)
              : (backRouteDef ?? undefined),
          );
          this.#isHidden.set(snapshot.data['hidden'] ?? false);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  setTitle(title: string): void {
    this.#title.set(title);
  }

  disableTitle(): void {
    this.#titleDisabled.set(true);
  }

  private getDeepestSnapshot(): ActivatedRouteSnapshot {
    let snapshot = this.activatedRoute.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return snapshot;
  }
}
