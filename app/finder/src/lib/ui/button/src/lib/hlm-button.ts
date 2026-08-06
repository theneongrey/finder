import { type BooleanInput } from '@angular/cdk/coercion';
import {
  afterNextRender,
  ApplicationRef,
  booleanAttribute,
  ComponentRef,
  createComponent,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  Renderer2,
  signal,
} from '@angular/core';
import { BrnButton } from '@spartan-ng/brain/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { injectBrnButtonConfig } from './hlm-button.token';

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px data-[matches-spartan-invalid=true]:ring-3 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs',
        secondary:
          'bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
        ghost:
          'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
        sm: 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        lg: 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-9',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3)]",
        'icon-sm':
          'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: 'button[hlmBtn], a[hlmBtn]',
  exportAs: 'hlmBtn',
  hostDirectives: [{ directive: BrnButton, inputs: ['disabled'] }],
  host: { 'data-slot': 'button' },
})
export class HlmButton implements OnDestroy {
  private readonly _elementRef = inject(ElementRef<HTMLButtonElement>);
  private readonly _renderer = inject(Renderer2);
  private readonly _appRef = inject(ApplicationRef);
  private readonly _config = injectBrnButtonConfig();

  private readonly _additionalClasses = signal<ClassValue>('');
  private readonly _iconOnly = signal(false);

  private _iconEl: HTMLElement | null = null;
  private _spinnerRef: ComponentRef<HlmSpinner> | null = null;

  public readonly variant = input<ButtonVariants['variant']>(this._config.variant);
  public readonly size = input<ButtonVariants['size']>(this._config.size);
  public readonly icon = input<string | undefined>(undefined);
  public readonly loading = input<boolean, BooleanInput>(false, { transform: booleanAttribute });

  constructor() {
    afterNextRender(() => {
      const el = this._elementRef.nativeElement;
      const hasContent = Array.from<ChildNode>(el.childNodes).some((node) => {
        if (this._iconEl && node === this._iconEl) return false;
        if (this._spinnerRef && node === this._spinnerRef.location.nativeElement) return false;
        return !!(node.textContent?.trim());
      });
      this._iconOnly.set(!!this.icon() && !hasContent);
    });

    classes(() => [
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this._iconOnly() ? 'aspect-square p-0' : '',
      this._additionalClasses(),
    ]);

    effect(() => {
      const loading = this.loading();
      const iconClass = this.icon();
      const button = this._elementRef.nativeElement;

      this._clearIcon();
      this._clearSpinner();

      if (loading) {
        button.setAttribute('disabled', '');
        button.setAttribute('data-disabled', '');
        this._spinnerRef = createComponent(HlmSpinner, {
          environmentInjector: this._appRef.injector,
        });
        this._appRef.attachView(this._spinnerRef.hostView);
        this._renderer.insertBefore(
          button,
          this._spinnerRef.location.nativeElement,
          button.firstChild,
        );
      } else {
        button.removeAttribute('disabled');
        button.removeAttribute('data-disabled');
        if (iconClass) {
          this._iconEl = this._renderer.createElement('i');
          iconClass
            .split(' ')
            .filter(Boolean)
            .forEach((cls) => this._renderer.addClass(this._iconEl!, cls));
          this._renderer.insertBefore(button, this._iconEl, button.firstChild);
        }
      }
    });
  }

  private _clearIcon(): void {
    if (this._iconEl) {
      this._renderer.removeChild(this._elementRef.nativeElement, this._iconEl);
      this._iconEl = null;
    }
  }

  private _clearSpinner(): void {
    if (this._spinnerRef) {
      this._renderer.removeChild(
        this._elementRef.nativeElement,
        this._spinnerRef.location.nativeElement,
      );
      this._appRef.detachView(this._spinnerRef.hostView);
      this._spinnerRef.destroy();
      this._spinnerRef = null;
    }
  }

  setClass(value: string): void {
    this._additionalClasses.set(value);
  }

  ngOnDestroy(): void {
    this._clearSpinner();
  }
}
