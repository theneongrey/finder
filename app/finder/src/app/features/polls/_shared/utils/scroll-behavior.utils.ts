/** Smooth scrolling, unless the user asked the OS for reduced motion. */
export function preferredScrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth';
}
