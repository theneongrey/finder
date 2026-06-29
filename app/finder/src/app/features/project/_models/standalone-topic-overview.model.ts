export interface StandalonePollOverview {
  projectId: string;
  pollId: string;
  name: string;
  description: string;
  optionType: number;
  optionCount: number;
  commentCount: number;
  lastUpdated: string;
  nextOpenOptionId?: string;
}
