export enum OptionType {
  YesNo = 0,
  Rating = 1,
}

export interface Option {
  id: string;
  text: string;
  optionType: OptionType;
  votes: number;
}

export interface Topic {
  id: string;
  name: string;
  options: Option[];
}

export interface Project {
  id: string;
  name: string;
  topics: Topic[];
}
