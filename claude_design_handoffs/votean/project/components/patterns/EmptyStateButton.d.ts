/**
 * @startingPoint section="Patterns" subtitle="Dashed-border add-new affordance" viewport="700x220"
 */
export interface EmptyStateButtonProps {
  layout?: 'row' | 'tile';
  icon?: string;
  label: string;
  onClick?: () => void;
}

export function EmptyStateButton(props: EmptyStateButtonProps): JSX.Element;
