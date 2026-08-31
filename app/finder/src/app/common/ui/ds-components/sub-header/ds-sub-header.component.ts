import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'ds-sub-header',
    templateUrl: './ds-sub-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'px-7 py-2.5 sticky top-[60px] z-10',
        style: 'background: rgba(255,253,249,.9); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(20,24,28,.06)',
    },
})
export class DsSubHeaderComponent {}
