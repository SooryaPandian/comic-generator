
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ComicState, ComicAction } from '../types/comic';

const initialState: ComicState = {
  mainTitle: '',
  description: '',
  characters: [],
  pages: [],
  currentPage: 0,
  generatedImages: {},
  generationStatus: 'idle',
  autoGenerate: false,
};

const ComicContext = createContext<{
  state: ComicState;
  dispatch: React.Dispatch<ComicAction>;
} | undefined>(undefined);

const comicReducer = (state: ComicState, action: ComicAction): ComicState => {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, mainTitle: action.payload };
    
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    
    case 'ADD_CHARACTER':
      return { ...state, characters: [...state.characters, action.payload] };
    
    case 'REMOVE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter((_, index) => index !== action.payload),
      };
    
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map((char, idx) =>
          idx === action.payload.index ? action.payload.character : char
        ),
      };
    
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    
    case 'UPDATE_PAGE':
      return {
        ...state,
        pages: state.pages.map((page) =>
          page.number === action.payload.pageNumber
            ? { ...page, ...action.payload.page }
            : page
        ),
      };
    
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'ADD_GENERATED_IMAGE':
      return {
        ...state,
        generatedImages: {
          ...state.generatedImages,
          [action.payload.key]: [
            ...(state.generatedImages[action.payload.key] || []),
            action.payload.url,
          ],
        },
      };
    
    case 'SET_GENERATION_STATUS':
      return { ...state, generationStatus: action.payload };
    
    case 'SET_AUTO_GENERATE':
      return { ...state, autoGenerate: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    case 'LOAD_STATE':
      return action.payload;
    
    default:
      return state;
  }
};

interface ComicProviderProps {
  children: React.ReactNode;
}

export const ComicProvider: React.FC<ComicProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(comicReducer, initialState, () => {
    // Load saved state from localStorage if available
    const savedState = localStorage.getItem('comicState');
    return savedState ? JSON.parse(savedState) : initialState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('comicState', JSON.stringify(state));
  }, [state]);

  return (
    <ComicContext.Provider value={{ state, dispatch }}>
      {children}
    </ComicContext.Provider>
  );
};

export const useComicContext = () => {
  const context = useContext(ComicContext);
  if (context === undefined) {
    throw new Error('useComicContext must be used within a ComicProvider');
  }
  return context;
};
