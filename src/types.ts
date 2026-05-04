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

export interface Paper {
  id: string;
  title: string;
  content: any; // TipTap JSON
  sources: Source[];
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

