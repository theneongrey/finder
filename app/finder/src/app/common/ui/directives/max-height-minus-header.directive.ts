import { Directive, OnDestroy, OnInit, signal } from '@angular/core';

@Directive({
  selector: '[fMaxHeightMinusHeader]',
  host: {
    '[style.max-height]': 'maxHeight()',
  },
})
export class MaxHeightMinusHeaderDirective implements OnInit, OnDestroy {
  private resizeObserver: ResizeObserver | null = null;
  protected maxHeight = signal('100vh');

  ngOnInit(): void {
    const header = document.querySelector('header');

    const updateHeight = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      this.maxHeight.set(`calc(100vh - ${headerHeight}px`);
    };

    // Initiale Berechnung
    updateHeight();

    // ResizeObserver für dynamische Header-Höhenänderungen
    if (header) {
      this.resizeObserver = new ResizeObserver(updateHeight);
      this.resizeObserver.observe(header);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
