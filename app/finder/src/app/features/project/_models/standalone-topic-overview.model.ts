export interface StandaloneTopicOverview {
  projectId: string;
  topicId: string;
  name: string;
  description: string;
  optionType: number;
  optionCount: number;
  commentCount: number;
  lastUpdated: string;
  nextOpenOptionId?: string;
}
