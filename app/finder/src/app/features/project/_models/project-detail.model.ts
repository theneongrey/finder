export enum OptionType {
  YesNo = 'YesNo',
  Rating = 'Rating',
}

export interface Option {
  id: string;
  text: string;
  optionType: OptionType;
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
