import { toast } from 'sonner';

// Mock API for development - replace with actual endpoints in production
const BASE_URL = 'http://127.0.0.1:5000';

const mockDelay = (min = 500, max = 2000) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || 'An error occurred';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json();
};

const API = {
  generateStory: async (payload) => {
    console.log('Sending story generation request with payload:', payload);
    try {
      const response = await fetch(`${BASE_URL}/generate/story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characters: payload.characters,
          title: payload.title || '',
          description: payload.description,
          generate_title: payload.title ? false : true,
          pagesCount: payload.pagesCount || 10,
        }),
      });

      const data = await handleResponse(response);
      console.log('Received response:', data);
      return {
        success: true,
        data: {
          mainTitle: data.main_title,
          description: data.description,
          characters: data.characters,
          pages: data.titles.map((title, index) => ({
            number: index + 1,
            title,
            content: '',
            description:data.descriptions[index] || '',
            imagePrompts: [],
            keyDevelopments: [],
          })),
        },
      };
    } catch (error) {
      console.error('Error generating story:', error);
      return { success: false, error: error.message };
    }
  },

  regenerateTitle: async (payload) => {
    try {
      // Simulating API call delay
      await mockDelay();
  
      const response = await fetch(`${BASE_URL}/generate/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate title');
      }
  
      return {
        success: true,
        data: data.title, // Ensure we extract only the title
      };
    } catch (error) {
      console.error('Error regenerating title:', error);
      return { success: false, error: error.message };
    }
  },
  

  generatePageContent: async (payload) => {
    try {
      const response = await fetch(`${BASE_URL}/generate/page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          main_title: payload.title,
          description: payload.description,
          all_titles: payload.pages,
          characters: payload.characters,
          current_title: payload.title,
          previous_development: payload.previousDevelopment,
          next_page_suggestion: payload.nextPageSuggestion,
          current_description: payload.description,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate page content');
      }
  
      const data = await response.json();
  
      return {
        success: true,
        data: {
          content: data.content || '',
          keyDevelopments: data.key_developments || [],
          nextSuggestions: data.next_suggestions || [],
          imagePrompts: data.image_prompts || [],
        },
      };
    } catch (error) {
      console.error('Error generating page content:', error);
      return { success: false, error: error.message };
    }
  },
  
  generateImage: async (payload) => {
    try {
        const response = await fetch(`${BASE_URL}/generate/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.image) {
            return { success: true, data: data.image};
        } else {
            throw new Error(data.error || 'Image generation failed');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        return { success: false, error: error.message };
    }
}

};

export default API;
