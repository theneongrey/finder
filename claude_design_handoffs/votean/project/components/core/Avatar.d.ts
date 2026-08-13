export interface AvatarProps {
  initial: string;
  bg?: string;
  fg?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  /** White ring border, used when avatars overlap in a stack. */
  ring?: boolean;
}

export function Avatar(props: AvatarProps): JSX.Element;
