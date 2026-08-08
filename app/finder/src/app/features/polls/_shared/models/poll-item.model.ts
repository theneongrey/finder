import { OptionType } from './poll-detail.model';
import { PollRole } from './poll-role.enum';

export interface PollItem {
  pollId: string;
  projectId: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  lastVoteAt?: string;
  nextOpenOptionId?: string;
  role: PollRole;
  totalParticipants: number;
  votedCount: number;
  currentUserVoted: boolean;
}
