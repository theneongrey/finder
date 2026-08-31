import {
    ChangeDetectionStrategy,
    Component,
    input,
    model,
} from '@angular/core';
import { DsBottomSheetComponent } from '../bottom-sheet/ds-bottom-sheet.component';

@Component({
    selector: 'app-share-drawer',
    imports: [DsBottomSheetComponent],
    templateUrl: './share-drawer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDrawerComponent {
    title = input.required<string>();
    subtitle = input.required<string>();
    visible = model(false);
}
