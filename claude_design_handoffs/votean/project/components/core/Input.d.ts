export interface InputProps {
  type?: 'text' | 'date' | 'time' | 'email';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Field background — white on cream panels (forms), cream on white cards (comment box). */
  background?: string;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
