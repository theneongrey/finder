import { inject, Injectable, signal } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter } from 'rxjs';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class TitleBarService {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  #title = signal<string | null | undefined>(undefined);
  title = this.#title.asReadonly();
  #backRoute = signal<string | undefined>(undefined);
  backRoute = this.#backRoute.asReadonly();
  #isHidden = signal<boolean>(false);
  isHidden = this.#isHidden.asReadonly();

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        tap(() => {
          this.update();
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.update();
  }

  setTitle(title: string): void {
    this.#title.set(title);
  }

  setBackRoute(route: string): void {
    this.#backRoute.set(route);
  }

  clearTitle(): void {
    this.#title.set(undefined);
  }

  disableTitle(): void {
    this.#title.set(null);
  }

  private update(): void {
    const snapshot = this.getDeepestSnapshot();
    const backRouteDef = snapshot.data['backRoute'];
    this.#backRoute.set(
      typeof backRouteDef === 'function'
        ? backRouteDef(snapshot)
        : (backRouteDef ?? undefined),
    );
    this.#isHidden.set(snapshot.data['hidden'] ?? false);
  }

  private getDeepestSnapshot(): ActivatedRouteSnapshot {
    let snapshot = this.activatedRoute.snapshot;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot;
  }
}
