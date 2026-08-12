/**
 * @startingPoint section="Core" subtitle="Underline tab navigation with count chips" viewport="600x90"
 */
export interface TabItem {
  value: string;
  label: string;
  count?: number;
}
export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

export function Tabs(props: TabsProps): JSX.Element;
