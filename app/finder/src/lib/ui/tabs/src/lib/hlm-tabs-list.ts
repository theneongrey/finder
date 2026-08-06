import { Directive, input } from '@angular/core';
import { BrnTabsList } from '@spartan-ng/brain/tabs';
import { classes } from '@spartan-ng/helm/utils';
import { type VariantProps, cva } from 'class-variance-authority';

export const listVariants = cva(
  'group/tabs-list text-muted-foreground inline-flex items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'bg-muted rounded-lg p-[3px] group-data-horizontal/tabs:h-9 w-fit',
        line: 'gap-6 bg-transparent !w-full border-b border-border !p-0 !rounded-none !h-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
type ListVariants = VariantProps<typeof listVariants>;

@Directive({
  selector: '[hlmTabsList],hlm-tabs-list',
  hostDirectives: [BrnTabsList],
  host: {
    'data-slot': 'tabs-list',
    '[attr.data-variant]': 'variant()',
  },
})
export class HlmTabsList {
  public readonly variant = input<ListVariants['variant']>('default');

  constructor() {
    classes(() => listVariants({ variant: this.variant() }));
  }
}
