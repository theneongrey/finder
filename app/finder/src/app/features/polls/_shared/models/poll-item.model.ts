import { PollRole } from './poll-role.enum';
import { PollParticipant } from './standalone-poll-overview.model';
import { OptionType } from '@common/models/option-type.model';

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
  participants: PollParticipant[];
  isFavorite: boolean;
  closeDate?: string;
  isClosed: boolean;
}
