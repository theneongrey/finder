/**
 * @startingPoint section="Core" subtitle="Pill CTA buttons — primary, dark, outline, subtle, ghost" viewport="700x160"
 */
export interface ButtonProps {
  variant?: 'primary' | 'dark' | 'outline' | 'subtle' | 'ghost';
  /** Optional leading Icon name (see Icon component). */
  icon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
