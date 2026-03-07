import {
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

@Directive({
  selector: '[fMaxHeightMinusHeader]',
  host: {
    '[style.max-height]': 'maxHeight()',
  },
})
export class MaxHeightMinusHeaderDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;
  protected maxHeight = signal('100vh');

  ngOnInit(): void {
    const header = document.querySelector('header');
    if (!header) return;

    const updateHeight = () => {
      const headerHeight = header.getBoundingClientRect().height;
      this.maxHeight.set(`calc(100vh - ${headerHeight}px)`);
    };

    // Initiale Berechnung
    updateHeight();

    // ResizeObserver für dynamische Header-Höhenänderungen
    this.resizeObserver = new ResizeObserver(updateHeight);
    this.resizeObserver.observe(header);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
