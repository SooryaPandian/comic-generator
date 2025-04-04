
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const initialState = {
  title: '',
  description: '',
  pages: [],
  characters: [],
  pagesCount: 10,
  generatedImages: {},
  generationStatus: 'idle',
  autoGenerate: true,
  isGenerating: false,
};

const ComicContext = createContext(undefined);
// Reducer Function
const comicReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_PAGES':
      return { ...state, pages: action.payload };
    case 'SET_CHARACTERS':
      return { ...state, characters: action.payload };
    case 'SET_PAGES_COUNT':
      return { ...state, pagesCount: action.payload };
    case 'TOGGLE_AUTO_GENERATE':
      return { ...state, autoGenerate: action.payload };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
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
        console.log('Adding generated image:', action.payload);
        return {
          ...state,
          generatedImages: {
            ...state.generatedImages,
            [action.payload.pageNumber]: {
              ...(state.generatedImages?.[action.payload.pageNumber] ?? {}),
              [action.payload.panelNumber]: action.payload.url, // Replace existing image
            },
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


// ✅ Only ONE ComicProvider function
export const ComicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(comicReducer, initialState, () => {
    const savedState = localStorage.getItem('comicState');

    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        currentPage: 1, // Force reset currentPage
        // characters: [], // Reset characters if needed
      };
    }

    return initialState;
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
