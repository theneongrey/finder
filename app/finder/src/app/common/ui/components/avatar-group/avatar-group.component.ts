import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ds-avatar-group',
  template: '<ng-content />',
  styleUrl: './avatar-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DsAvatarGroupComponent {}
