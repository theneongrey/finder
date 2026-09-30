import { DestroyRef, inject, Signal, signal } from '@angular/core';

/** Midnight of the given day. */
export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Today's date (at midnight) that rolls over at midnight while the caller
 * lives. Must run in an injection context.
 */
export function injectToday(): Signal<Date> {
    const today = signal(startOfDay(new Date()));
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
        const now = new Date();
        const next = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
        );
        timer = setTimeout(() => {
            today.set(startOfDay(new Date()));
            schedule();
        }, next.getTime() - now.getTime());
    };
    schedule();
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    return today.asReadonly();
}
