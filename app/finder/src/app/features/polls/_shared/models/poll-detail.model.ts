import { PollRole } from './poll-role.enum';
import { OptionType } from '@common/models/option-type.model';

export enum VisibilityType {
  VisibleForSelectedOnly = 0,
  VisibleForEverybody = 1,
}

export interface Poll {
  id: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  commentCount: number;
  nextOpenOptionId?: string;
}

export interface Vote {
  person: string;
  choice: string;
}

export interface OptionMeta {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
}

export interface OptionDetail {
  id: string;
  text: string;
  description: string;
  meta?: OptionMeta;
  votes: Vote[];
  choice: string | null;
}

export interface CommentAuthor {
  name: string;
  picture: string;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  created: string;
  quote?: string;
}

export interface PollDetail {
  id: string;
  name: string;
  description: string;
  optionType: OptionType;
  options: OptionDetail[];
  comments: Comment[];
  closeDate?: string;
  isClosed: boolean;
}

export interface Option {
  id: string;
  text: string;
  description: string;
  meta?: OptionMeta;
  votes: number;
  choice: string | null;
}

export interface SharedWith {
  name: string;
  email: string;
  role: PollRole;
  picture?: string;
}

export interface SharingContact {
  name: string;
  email: string;
  picture?: string;
  shareCount: number;
}

export interface PublicOptionPreview {
  id: string;
  text: string;
  description: string;
  voteCount: number;
}

export interface PublicPollPreview {
  id: string;
  name: string;
  description: string;
  optionType: OptionType;
  closeDate: string | null;
  isClosed: boolean;
  options: PublicOptionPreview[];
  participantCount: number;
  totalVotes: number;
}

export interface PublicParticipant {
  name: string;
  hasVoted: boolean;
}

export interface PublicProjectInfo {
  projectId: string;
  isStandalone: boolean;
  pollId?: string;
  pollPreview?: PublicPollPreview;
  projectName: string;
  projectDescription?: string;
  participants: PublicParticipant[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  polls: Poll[];
  creator: string;
  role: PollRole;
  sharedWith: SharedWith[];
  visibilityType: VisibilityType;
}
