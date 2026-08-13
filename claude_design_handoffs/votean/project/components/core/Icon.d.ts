export interface IconProps {
  /** Glyph name — see ICON_NAMES for the full list (logo, chevron-left, share, trash, calendar, heart, ...). */
  name: string;
  /** Pixel size (width = height). Default 18. */
  size?: number;
  /** Stroke/fill color. Default currentColor — set via the parent's CSS color. */
  color?: string;
  style?: React.CSSProperties;
}

export function Icon(props: IconProps): JSX.Element | null;
export const ICON_NAMES: string[];
