import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface IconPath { d: string }
interface IconCircle { cx: number; cy: number; r: number; filled?: boolean }
interface IconRect { x: number; y: number; width: number; height: number; rx?: number }
interface IconDef {
  paths?: IconPath[];
  circles?: IconCircle[];
  rects?: IconRect[];
  strokeWidth?: number;
  fill?: boolean;
}

const ICONS: Record<string, IconDef> = {
  logo: { paths: [{ d: 'M4.5 12.5l4.5 4.5L20 5' }], strokeWidth: 3.4 },
  'chevron-left': { paths: [{ d: 'M15 5l-7 7 7 7' }], strokeWidth: 2.6 },
  'chevron-right': { paths: [{ d: 'M9 5l7 7-7 7' }], strokeWidth: 2.6 },
  'arrow-right': { paths: [{ d: 'M4 12h16' }, { d: 'M14 6l6 6-6 6' }], strokeWidth: 2.4 },
  kebab: {
    fill: true,
    paths: [{ d: 'M12 3.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM12 10.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM12 17.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z' }],
  },
  comment: { paths: [{ d: 'M20 4H4a1.5 1.5 0 0 0-1.5 1.5V15A1.5 1.5 0 0 0 4 16.5h3V20l4-3.5h9A1.5 1.5 0 0 0 21.5 15V5.5A1.5 1.5 0 0 0 20 4z' }] },
  share: {
    strokeWidth: 2,
    circles: [{ cx: 18, cy: 5, r: 2.6 }, { cx: 6, cy: 12, r: 2.6 }, { cx: 18, cy: 19, r: 2.6 }],
    paths: [{ d: 'M8.3 10.7l7.4-4.4' }, { d: 'M8.3 13.3l7.4 4.4' }],
  },
  edit: { paths: [{ d: 'M4 20h4L20 8l-4-4L4 16z' }, { d: 'M14 6l4 4' }] },
  trash: { paths: [{ d: 'M4 7h16' }, { d: 'M9 7V4h6v3' }, { d: 'M6 7l1 13h10l1-13' }] },
  lock: {
    strokeWidth: 2.2,
    rects: [{ x: 5, y: 10, width: 14, height: 10, rx: 2.5 }],
    paths: [{ d: 'M8 10V7a4 4 0 0 1 8 0v3' }],
  },
  users: {
    strokeWidth: 2,
    circles: [{ cx: 9.5, cy: 7.5, r: 3.5 }],
    paths: [
      { d: 'M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 5 18.5V20' },
      { d: 'M19 20v-1.5a3.5 3.5 0 0 0-2.5-3.35' },
      { d: 'M15 4.2a3.5 3.5 0 0 1 0 6.6' },
    ],
  },
  calendar: {
    strokeWidth: 2,
    rects: [{ x: 3.5, y: 5, width: 17, height: 15.5, rx: 2.5 }],
    paths: [{ d: 'M3.5 9.5h17' }, { d: 'M8 3v4' }, { d: 'M16 3v4' }],
  },
  clock: { strokeWidth: 2.2, circles: [{ cx: 12, cy: 12, r: 8.5 }], paths: [{ d: 'M12 7.5V12l3 2' }] },
  refresh: {
    strokeWidth: 2.2,
    paths: [
      { d: 'M17 2.5l4 4-4 4' },
      { d: 'M3 12.9V12a9 9 0 0 1 15-6.8l3 2.9' },
      { d: 'M7 21.5l-4-4 4-4' },
      { d: 'M21 11.1V12a9 9 0 0 1-15 6.8l-3-2.9' },
    ],
  },
  play: { fill: true, paths: [{ d: 'M6 4l14 8-14 8V4z' }] },
  send: { fill: true, paths: [{ d: 'M2.5 12L21 3l-6 18-4.5-7.5L2.5 12z' }] },
  trophy: {
    strokeWidth: 2,
    paths: [
      { d: 'M8 4h8v4a4 4 0 0 1-8 0V4z' },
      { d: 'M8 5H5a2 2 0 0 0 2 4' },
      { d: 'M16 5h3a2 2 0 0 1-2 4' },
      { d: 'M12 12v3' },
      { d: 'M9 19h6' },
      { d: 'M10 15h4l.6 4H9.4z' },
    ],
  },
  close: { strokeWidth: 2.4, paths: [{ d: 'M5 5l14 14' }, { d: 'M19 5L5 19' }] },
  check: { strokeWidth: 3, paths: [{ d: 'M4 12.5l5 5L20 6' }] },
  heart: { strokeWidth: 2.1, paths: [{ d: 'M12 20.3s-7.5-4.6-9.7-9C.8 8 2 4.7 5 3.7c2.2-.7 4.3.2 5.6 2 .4.5 1 1.4 1.4 1.4s1-.9 1.4-1.4c1.3-1.8 3.4-2.7 5.6-2 3 1 4.2 4.3 2.7 7.6-2.2 4.4-9.7 9-9.7 9z' }] },
  grid: {
    strokeWidth: 2,
    rects: [
      { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.8 },
      { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.8 },
      { x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.8 },
      { x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.8 },
    ],
  },
  folder: { strokeWidth: 2, paths: [{ d: 'M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }] },
  checklist: {
    strokeWidth: 2,
    rects: [{ x: 3.5, y: 3.5, width: 17, height: 17, rx: 4.5 }],
    paths: [{ d: 'M8 12.3l2.7 2.7L16.4 9' }],
  },
  plus: { strokeWidth: 2.2, paths: [{ d: 'M12 5v14' }, { d: 'M5 12h14' }] },
  'circle-dot': {
    strokeWidth: 2.1,
    circles: [
      { cx: 12, cy: 12, r: 8.5 },
      { cx: 12, cy: 12, r: 3.8, filled: true },
    ],
  },
  mail: {
    strokeWidth: 2,
    rects: [{ x: 3, y: 5.5, width: 18, height: 13, rx: 3 }],
    paths: [{ d: 'M4 8l8 5 8-5' }],
  },
  info: {
    strokeWidth: 2.2,
    circles: [{ cx: 12, cy: 12, r: 8.6 }],
    paths: [{ d: 'M12 11v5.2' }, { d: 'M12 7.9v.1' }],
  },
  globe: {
    strokeWidth: 2,
    circles: [{ cx: 12, cy: 12, r: 8.5 }],
    paths: [
      { d: 'M12 3.5c-2 3-3 5.5-3 8.5s1 5.5 3 8.5' },
      { d: 'M12 3.5c2 3 3 5.5 3 8.5s-1 5.5-3 8.5' },
      { d: 'M3.5 9h17' },
      { d: 'M3.5 15h17' },
    ],
  },
};

export const ICON_NAMES = Object.keys(ICONS);

@Component({
  selector: 'ds-icon',
  templateUrl: './ds-icon.component.html',
  styleUrl: './ds-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class DsIconComponent {
  name = input.required<string>();
  size = input<number>(18);
  color = input<string>('currentColor');

  protected readonly def = computed(() => ICONS[this.name()]);
  protected readonly fillMode = computed(() => !!this.def()?.fill);
  protected readonly strokeWidth = computed(() => this.def()?.strokeWidth ?? 2);
  protected readonly circles = computed(() => this.def()?.circles ?? []);
  protected readonly rects = computed(() => this.def()?.rects ?? []);
  protected readonly paths = computed(() => this.def()?.paths ?? []);
}
