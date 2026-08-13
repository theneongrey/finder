/**
 * @startingPoint section="Core" subtitle="Overlapping member avatars with overflow + add" viewport="500x100"
 */
export interface AvatarStackMember {
  initial: string;
  bg: string;
  fg: string;
}
export interface AvatarStackProps {
  members: AvatarStackMember[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  /** If set, renders a trailing dashed "+" button (e.g. open the share sheet). */
  onAddClick?: () => void;
}

export function AvatarStack(props: AvatarStackProps): JSX.Element;
