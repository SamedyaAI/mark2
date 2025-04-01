/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ASSISTANT_MINDMAP_ID: string
  readonly VITE_ASSISTANT_INSIGHTS_ID: string
  readonly VITE_ASSISTANT_ACHIEVEMENTS_ID: string
  readonly VITE_ASSISTANT_RESEARCH_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}