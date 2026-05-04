export type SourceType = 'book' | 'article' | 'website' | 'journal';

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  authors: string;
  year: string;
  publisher?: string;
  url?: string;
  journal?: string;
  doi?: string;
  addedAt: number;
}

export interface ResearchArtifact {
  id: string;
  query: string;
  content: string;
  type: 'title' | 'outline' | 'questions' | 'synthesis';
  timestamp: number;
  linkedSourceIds?: string[];
}

export interface Paper {
  id: string;
  title: string;
  content: any; // TipTap JSON
  sources: Source[];
  researchArtifacts?: ResearchArtifact[];
  updatedAt: number;
}

export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DocumentVersion {
  id: string;
  timestamp: number;
  content: any; // TipTap JSON
  author: string;
  label?: string;
}

