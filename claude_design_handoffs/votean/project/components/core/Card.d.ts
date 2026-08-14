export interface CardProps {
  padding?: number | string;
  radius?: string;
  /** 4px left teal accent border instead of a hairline all-around border. */
  accentBorder?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
