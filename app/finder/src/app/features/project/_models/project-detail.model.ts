import { ProjectRole } from './project-role.enum';

export enum OptionType {
  YesNo,
  Rating,
  Date,
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  optionType: OptionType;
  optionCount: number;
  nextOpenOptionId?: string;
}

export interface Vote {
  person: string;
  choice: string;
}

export interface OptionDetail {
  id: string;
  text: string;
  votes: Vote[];
  choice: string | null;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  created: string;
}

export interface TopicDetail {
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
  topics: Topic[];
  creator: string;
  role: ProjectRole;
  sharedWith: SharedWith[];
}
