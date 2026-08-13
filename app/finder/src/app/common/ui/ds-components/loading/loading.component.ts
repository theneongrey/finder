import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';

const FADE_DURATION = 300;

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class LoadingComponent implements OnDestroy {
  isLoading = input.required<boolean>();
  count = input<number>(1);
  direction = input<'horizontal' | 'vertical'>('vertical');
  gap = input<string>('4px');
  minTime = input<number>(500);
  skeletonWidth = input<string>('100%');
  skeletonHeight = input<string>('1rem');
  innercss = input<string>('');

  private loadingStartTime = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly showContent = signal(false);
  protected readonly skeletonFading = signal(false);
  protected readonly skeletonArray = computed(() =>
    Array(this.count()).fill(null),
  );
  protected readonly flexDirection = computed(() =>
    this.direction() === 'horizontal' ? 'row' : 'column',
  );

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      if (loading) {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.loadingStartTime = Date.now();
        this.skeletonFading.set(false);
        this.showContent.set(false);
      } else {
        if (this.loadingStartTime === 0) {
          this.showContent.set(true);
        } else {
          const elapsed = Date.now() - this.loadingStartTime;
          const remaining = Math.max(0, this.minTime() - elapsed);
          this.loadingStartTime = 0;
          this.timer = setTimeout(() => this.fadeOutSkeleton(), remaining);
        }
      }
    });
  }

  private fadeOutSkeleton() {
    this.skeletonFading.set(true);
    this.timer = setTimeout(() => {
      this.showContent.set(true);
      this.skeletonFading.set(false);
      this.timer = null;
    }, FADE_DURATION);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
