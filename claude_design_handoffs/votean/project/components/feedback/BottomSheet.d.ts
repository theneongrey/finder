/**
 * @startingPoint section="Feedback" subtitle="Bottom-anchored modal sheet shell" viewport="480x400"
 */
export interface BottomSheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomSheet(props: BottomSheetProps): JSX.Element;
