/**
 * @startingPoint section="Patterns" subtitle="Yes/Skip/No voting trio" viewport="500x160"
 */
export interface VoteButtonsProps {
  onYes: () => void;
  onSkip: () => void;
  onNo: () => void;
}

export function VoteButtons(props: VoteButtonsProps): JSX.Element;
