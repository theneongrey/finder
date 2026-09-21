import {
    afterNextRender,
    Directive,
    ElementRef,
    inject,
    OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps keyboard focus within the host element while it is in the DOM, moves
 * focus inside on open, and restores it to the previously focused element on
 * destroy. Intended for modal-style surfaces (dialogs, drawers, bottom sheets).
 *
 * Focus semantics only — pair it with `role="dialog"` / `aria-modal="true"` and
 * an accessible name on the host for full screen-reader support. Apply directly
 * on an element (`<div fFocusTrap>`) or compose it onto a component via
 * `hostDirectives: [FocusTrapDirective]`.
 */
@Directive({
    selector: '[fFocusTrap]',
    host: {
        '(keydown)': 'onKeyDown($event)',
    },
})
export class FocusTrapDirective implements OnDestroy {
    private readonly host =
        inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly document = inject(DOCUMENT);

    /** Element focused before the trap opened, restored when it is destroyed. */
    private readonly previouslyFocused = this.document
        .activeElement as HTMLElement | null;

    constructor() {
        afterNextRender(() => this.focusFirstElement());
    }

    ngOnDestroy(): void {
        this.previouslyFocused?.focus?.();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key !== 'Tab') {
            return;
        }
        const focusable = this.focusableElements();
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = this.document.activeElement;

        if (
            event.shiftKey &&
            (active === first || !this.host.contains(active))
        ) {
            last.focus();
            event.preventDefault();
        } else if (
            !event.shiftKey &&
            (active === last || !this.host.contains(active))
        ) {
            first.focus();
            event.preventDefault();
        }
    }

    private focusableElements(): HTMLElement[] {
        return Array.from(
            this.host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
    }

    private focusFirstElement(): void {
        const target = this.focusableElements()[0];
        if (target) {
            target.focus();
            return;
        }
        // Nothing focusable inside — make the host itself focusable and focus it
        // so the overlay is announced and Tab is captured from the first press.
        if (!this.host.hasAttribute('tabindex')) {
            this.host.setAttribute('tabindex', '-1');
        }
        this.host.focus();
    }
}
