/**
 * @startingPoint section="Core" subtitle="Sliding-pill toggle for 2-3 options" viewport="500x80"
 */
export interface SegmentedOption {
  value: string;
  label: string;
}
export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
