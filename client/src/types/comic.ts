
export interface Character {
  name: string;
  description?: string;
}

export interface ComicPage {
  number: number;
  title: string;
  content: string;
  imagePrompts: string[];
  keyDevelopments: string[];
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'complete';

export interface ComicState {
  mainTitle: string;
  description: string;
  characters: Character[];
  pages: ComicPage[];
  currentPage: number;
  generatedImages: Record<string, string[]>; // pageNumber-panelNumber: urls[]
  generationStatus: GenerationStatus;
  autoGenerate: boolean;
}

export type ComicAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: number }
  | { type: 'UPDATE_CHARACTER'; payload: { index: number; character: Character } }
  | { type: 'SET_PAGES'; payload: ComicPage[] }
  | { type: 'UPDATE_PAGE'; payload: { pageNumber: number; page: Partial<ComicPage> } }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'ADD_GENERATED_IMAGE'; payload: { key: string; url: string } }
  | { type: 'SET_GENERATION_STATUS'; payload: GenerationStatus }
  | { type: 'SET_AUTO_GENERATE'; payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'LOAD_STATE'; payload: ComicState };
