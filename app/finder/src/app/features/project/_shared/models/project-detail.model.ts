import { ProjectRole } from './project-role.enum';

export enum OptionType {
  YesNo,
  Rating,
  Date,
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
  role: ProjectRole;
  picture?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  polls: Poll[];
  creator: string;
  role: ProjectRole;
  sharedWith: SharedWith[];
}
