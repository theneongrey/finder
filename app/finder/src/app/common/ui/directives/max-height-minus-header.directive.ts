import {
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

@Directive({
  selector: '[fMaxHeightMinusHeaderAndFooter]',
  host: {
    '[style.max-height]': 'maxHeight()',
  },
})
export class MaxHeightMinusHeaderDirective implements OnInit, OnDestroy {
  private resizeObserver: ResizeObserver | null = null;
  protected maxHeight = signal('100vh');

  ngOnInit(): void {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    const updateHeight = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      this.maxHeight.set(`calc(100vh - ${headerHeight}px - ${footerHeight}px)`);
    };

    // Initiale Berechnung
    updateHeight();

    // ResizeObserver für dynamische Header-Höhenänderungen
    if (header) {
      this.resizeObserver = new ResizeObserver(updateHeight);
      this.resizeObserver.observe(header);
    }
    if (footer) {
      this.resizeObserver = new ResizeObserver(updateHeight);
      this.resizeObserver.observe(footer);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
