import { SharedWith, VisibilityType } from './poll-detail.model';
import { PollRole } from './poll-role.enum';

export enum PollVotingStatus {
  None = 0,
  Partial = 1,
  Full = 2,
}

export interface PollParticipant {
  name: string;
  picture?: string;
  votingStatus: PollVotingStatus;
}

export interface StandalonePollOverview {
  projectId: string;
  pollId: string;
  name: string;
  description: string;
  optionType: number;
  optionCount: number;
  commentCount: number;
  lastUpdated: string;
  lastVoteAt?: string;
  nextOpenOptionId?: string;
  visibilityType: VisibilityType;
  sharedWith: SharedWith[];
  role: PollRole;
  totalParticipants: number;
  votedCount: number;
  currentUserVoted: boolean;
  participants: PollParticipant[];
}
