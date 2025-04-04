import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComicContext } from '@/context/ComicContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, ChevronRight } from 'lucide-react';
import API from '@/services/api';
import { toast } from 'sonner';

const PageReviewEditor = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useComicContext();
  const [isLoading, setIsLoading] = useState({});
  
  const handleTitleChange = (pageNumber, newTitle) => {
    dispatch({
      type: 'UPDATE_PAGE',
      payload: {
        pageNumber,
        page: { title: newTitle },
      },
    });
  };
  
  const handleRegenerateTitle = async (pageNumber) => {
    try {
      setIsLoading({ ...isLoading, [pageNumber]: true });
      
      const page = state.pages.find(p => p.number === pageNumber);
      if (!page) return;
      
      const response = await API.regenerateTitle({
        pageNumber,
        main_title: state.title,
        all_titles: state.pages.map(p => p.title),
        characters: state.characters,
        current_title: page.title,
        current_description: page.description,
      });
      
      if (response.success && response.data) {
        dispatch({
          type: 'UPDATE_PAGE',
          payload: {
            pageNumber,
            page: { title: response.data },
          },
        });
        toast.success(`Title for Page ${pageNumber} regenerated successfully`);
      }
    } catch (error) {
      toast.error('Failed to regenerate title');
    } finally {
      setIsLoading({ ...isLoading, [pageNumber]: false });
    }
  };
  
  const handleContinue = () => {
    const missingTitles = state.pages.some(page => !page.title.trim());
    if (missingTitles) {
      toast.error('All pages must have titles');
      return;
    }
    navigate('/content-generation');
  };
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1 comic-font text-comic-primary">
            {state.title || 'Your Comic'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {state.description || 'No description available.'}
          </p>
          {state.characters.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Characters:</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                {state.characters.map((char, index) => (
                  <li key={index}>{char}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-muted-foreground">
            Review and edit the titles for each page before proceeding
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Page</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.pages.map((page) => (
              <TableRow key={page.number}>
                <TableCell className="font-medium">{page.number}</TableCell>
                <TableCell>
                  <Input
                    value={page.title}
                    onChange={(e) => handleTitleChange(page.number, e.target.value)}
                    className="max-w-full"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRegenerateTitle(page.number)}
                    disabled={isLoading[page.number]}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleContinue}>
            Continue to Content Generation
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageReviewEditor;