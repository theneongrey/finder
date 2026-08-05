import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmSkeleton],hlm-skeleton',
	host: {
		'data-slot': 'skeleton',
	},
})
export class HlmSkeleton {
	constructor() {
		classes(() => 'tw:bg-muted tw:rounded-md tw:block tw:motion-safe:animate-pulse');
	}
}
