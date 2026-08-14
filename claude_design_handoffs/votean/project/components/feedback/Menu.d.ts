/**
 * @startingPoint section="Feedback" subtitle="Kebab dropdown menu (share/edit/delete)" viewport="500x220"
 */
export interface MenuItem {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}
export interface MenuProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  anchorStyle?: React.CSSProperties;
}

export function Menu(props: MenuProps): JSX.Element | null;
