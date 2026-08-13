export interface IconButtonProps {
  icon: string;
  variant?: 'surface' | 'ghost' | 'dark';
  size?: number;
  iconSize?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;
