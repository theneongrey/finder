import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DsAvatarComponent } from '../avatar/ds-avatar.component';

export interface AvatarItem {
  initial: string;
  bg: string;
  fg: string;
}

@Component({
  selector: 'ds-avatar-stack',
  imports: [DsAvatarComponent],
  template: `
    <div class="ds-avatar-stack">
      @for (m of shown(); track $index) {
        <div class="ds-avatar-stack__item">
          <ds-avatar [initial]="m.initial" [bg]="m.bg" [fg]="m.fg" [size]="px()" [ring]="true" />
        </div>
      }
      @if (extra() > 0) {
        <div
          class="ds-avatar-stack__overflow"
          [style.width.px]="px()"
          [style.height.px]="px()"
          [style.font-size.px]="overflowFontSize()"
        >+{{ extra() }}</div>
      }
      @if (showAdd()) {
        <button class="ds-avatar-stack__add" [style.width.px]="px()" [style.height.px]="px()" (click)="addClicked.emit()">+</button>
      }
    </div>
  `,
  styles: [`
    .ds-avatar-stack {
      display: flex;
      padding-left: 7px;
    }
    .ds-avatar-stack__item {
      margin-left: -7px;
    }
    .ds-avatar-stack__overflow {
      margin-left: -7px;
      border-radius: var(--radius-circle);
      background: var(--sand-200);
      color: var(--ink-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      font-weight: var(--weight-bold);
      border: 2.5px solid #fff;
      box-sizing: border-box;
    }
    .ds-avatar-stack__add {
      margin-left: -7px;
      border-radius: var(--radius-circle);
      background: #fff;
      border: 1.5px dashed var(--sand-500);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 500;
      line-height: 1;
      cursor: pointer;
      box-sizing: border-box;
      padding: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsAvatarStackComponent {
  avatars = input<AvatarItem[]>([]);
  max = input<number>(4);
  size = input<'sm' | 'md' | 'lg'>('md');
  showAdd = input<boolean>(false);

  addClicked = output<void>();

  protected readonly px = computed(() => {
    const s = this.size();
    return s === 'sm' ? 27 : s === 'lg' ? 38 : 29;
  });
  protected readonly shown = computed(() => this.avatars().slice(0, this.max()));
  protected readonly extra = computed(() => this.avatars().length - this.shown().length);
  protected readonly overflowFontSize = computed(() => Math.round(this.px() * 0.36));
}
