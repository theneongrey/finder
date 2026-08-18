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
  #subtitle = signal<string | undefined>(undefined);
  subtitle = this.#subtitle.asReadonly();
  #backRoute = signal<string | undefined>(undefined);
  backRoute = this.#backRoute.asReadonly();
  #backFn = signal<(() => void) | undefined>(undefined);
  backFn = this.#backFn.asReadonly();
  #progress = signal<number | undefined>(undefined);
  progress = this.#progress.asReadonly();
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

  setSubtitle(label: string): void {
    this.#subtitle.set(label);
  }

  setBackRoute(route: string): void {
    this.#backRoute.set(route);
  }

  setBackFn(fn: (() => void) | undefined): void {
    this.#backFn.set(fn);
  }

  setProgress(value: number | undefined): void {
    this.#progress.set(value);
  }

  clearTitle(): void {
    this.#title.set(undefined);
  }

  clearSubtitle(): void {
    this.#subtitle.set(undefined);
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
    this.#subtitle.set(undefined);
    this.#backFn.set(undefined);
    this.#progress.set(undefined);
  }

  private getDeepestSnapshot(): ActivatedRouteSnapshot {
    let snapshot = this.activatedRoute.snapshot;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot;
  }
}
