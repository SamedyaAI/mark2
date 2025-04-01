export const ASSISTANTS = {
  INSIGHTS: import.meta.env.VITE_ASSISTANT_INSIGHTS_ID,
  ACHIEVEMENTS: import.meta.env.VITE_ASSISTANT_ACHIEVEMENTS_ID,
  RESEARCH_IDEAS: import.meta.env.VITE_ASSISTANT_RESEARCH_ID,
} as const;

export type AssistantType = keyof typeof ASSISTANTS;

export interface AnalysisResult {
  type: AssistantType;
  content: string;
  status: 'idle' | 'loading' | 'complete' | 'error';
  error?: string;
}