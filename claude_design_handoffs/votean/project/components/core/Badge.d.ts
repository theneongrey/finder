/**
 * @startingPoint section="Core" subtitle="Count/role/status pills" viewport="700x120"
 */
export interface BadgeProps {
  variant?: 'accent' | 'neutral' | 'warning' | 'viewer' | 'contributor' | 'manager' | 'success';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;

export interface StatusDotProps {
  label: string;
  tone?: 'positive' | 'muted';
}
export function StatusDot(props: StatusDotProps): JSX.Element;
