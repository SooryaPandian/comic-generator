import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComicContext } from '@/context/ComicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, MinusCircle, Wand2 } from 'lucide-react';
import API from '@/services/api';
import { toast } from 'sonner';

const TitleInputForm = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useComicContext();
  
  const [title, setTitle] = useState(state.title);
  const [description, setDescription] = useState(state.description);
  const [characters, setCharacters] = useState(state.characters);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pagesCount, setPagesCount] = useState(3);
  
  const handleAddCharacter = () => {
    setCharacters([...characters,  '' ]);
  };
  
  const handleRemoveCharacter = (index) => {
    setCharacters(characters.filter((_, idx) => idx !== index));
  };
  
  const handleCharacterChange = (index, value) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index] = value ;
    setCharacters(updatedCharacters);
  };
  
  const handleContinue = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }
  
    if (!title.trim() && !autoGenerate) {
      toast.error('Please provide a title or enable auto-generation');
      return;
    }
  
    try {
      setIsGenerating(true);
  
      const requestPayload = {
        title,
        description,
        pagesCount,
        characters,
        generate_title: autoGenerate, // Backend expects this flag
      };
  
      const response = await API.generateStory(requestPayload);
  
      if (response.success && response.data) {
        const { mainTitle, description, characters, pages } = response.data;
  
        // Dispatch updates to store data in context
        dispatch({ type: 'SET_TITLE', payload: mainTitle });
        dispatch({ type: 'SET_DESCRIPTION', payload: description });
        dispatch({ type: 'SET_PAGES', payload: pages });
        dispatch({ type: 'SET_CHARACTERS', payload: characters });
  
        toast.success('Story outline generated successfully');
        navigate('/page-review'); // Navigate to the next step
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story outline');
    } finally {
      setIsGenerating(false);
    }
  };
  
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-comic-primary">
          Comic Creator Express
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Story Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the story you want to create..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-generate" 
            checked={autoGenerate} 
            onCheckedChange={setAutoGenerate} 
          />
          <Label htmlFor="auto-generate" className="cursor-pointer">
            Auto-generate story outline
          </Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pages-count">Number of Pages</Label>
          <Input
            id="pages-count"
            type="number"
            min={1}
            max={10}
            value={pagesCount}
            onChange={(e) => setPagesCount(parseInt(e.target.value) || 3)}
          />
        </div>
        
        {!autoGenerate && (
          <div className="space-y-2">
            <Label htmlFor="title">Comic Title</Label>
            <Input
              id="title"
              placeholder="Enter your comic title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Characters</Label>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleAddCharacter}
              type="button"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {characters.map((character, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder={`Character ${index + 1} name`}
                value={character}
                onChange={(e) => handleCharacterChange(index, e.target.value)}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleRemoveCharacter(index)}
                type="button"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {characters.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No characters added. Click the plus button to add characters.
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={isGenerating || (!title && !autoGenerate) || !description} 
          onClick={handleContinue}
        >
          {autoGenerate ? (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate & Continue'}
            </>
          ) : (
            'Continue to Page Review'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TitleInputForm;
