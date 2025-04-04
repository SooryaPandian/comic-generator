
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComicContext } from '@/context/ComicContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import ImagePanel from './ImagePanel';
import API from '@/services/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, RefreshCw, FileDown, Wand2 } from 'lucide-react';
import ProgressOverlay from './ProgressOverlay';
import { exportToPdf } from '@/utils/pdfExport';

const ContentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useComicContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const currentPageNumber = state.currentPage || 1;
  const currentPage = state.pages.find(p => p.number === currentPageNumber);
  const totalPages = state.pages.length;
  
  // Get the progress percentage for the progress bar
  const progressPercentage = (currentPageNumber / totalPages) * 100;
  
  useEffect(() => {
    // If no pages exist, navigate back to the start
    if (state.pages.length === 0) {
      navigate('/');
    }
  }, [state.pages, navigate]);
  
  const handleContentChange = (content: string) => {
    if (!currentPage) return;
    
    dispatch({
      type: 'UPDATE_PAGE',
      payload: {
        pageNumber: currentPageNumber,
        page: { content },
      },
    });
  };
  
  const handleGenerateContent = async () => {
    if (!currentPage) return;
  
    try {
      setIsGenerating(true);
  
      const response = await API.generatePageContent({
        pageNumber: currentPageNumber,
        title: currentPage.title,
        pages:state.pages.map(page => page.title),
        description: state.description,
        characters: state.characters,
        previousDevelopment: currentPage.previousDevelopment || '',
        nextPageSuggestion: currentPage.nextPageSuggestion || '',
      });
  
      if (response.success && response.data) {
        const { content, keyDevelopments, nextSuggestions, imagePrompts } = response.data;
  
        dispatch({
          type: 'UPDATE_PAGE',
          payload: {
            pageNumber: currentPageNumber,
            page: {
              content,
              keyDevelopments,
              nextSuggestions,
              imagePrompts,
            },
          },
        });
  
        toast.success(`Content generated for page ${currentPageNumber}`);
      }
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };
  
  
  const handleAutoGenerateAll = async () => {
    setShowOverlay(true);
    dispatch({ type: 'SET_GENERATION_STATUS', payload: 'generating' });
    
    for (let i = 0; i < state.pages.length; i++) {
      const page = state.pages[i];
      
      try {
        // Set current page
        dispatch({ type: 'SET_CURRENT_PAGE', payload: page.number });
        
        // Generate content first
        const contentResponse = await API.generatePageContent({
          pageNumber: page.number,
          title: page.title,
          description: state.description,
          characters: state.characters.map(c => c.name),
        });
        
        if (contentResponse.success && contentResponse.data) {
          const { content, imagePrompts, keyDevelopments } = contentResponse.data;
          
          dispatch({
            type: 'UPDATE_PAGE',
            payload: {
              pageNumber: page.number,
              page: {
                content,
                imagePrompts,
                keyDevelopments,
              },
            },
          });
          
          // Then generate images for each prompt
          if (imagePrompts && imagePrompts.length > 0) {
            for (let j = 0; j < imagePrompts.length; j++) {
              const imageResponse = await API.generateImage({
                prompt: imagePrompts[j],
                pageNumber: page.number,
                panelNumber: j + 1,
                style: 'comic book',
              });
              
              if (imageResponse.success && imageResponse.data) {
                dispatch({
                  type: 'ADD_GENERATED_IMAGE',
                  payload: {
                    key: `${page.number}-${j + 1}`,
                    url: imageResponse.data,
                  },
                });
              }
            }
          }
        }
      } catch (error) {
        toast.error(`Error generating page ${page.number}`);
      }
    }
    
    dispatch({ type: 'SET_GENERATION_STATUS', payload: 'complete' });
    setShowOverlay(false);
    toast.success('All pages have been generated');
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      toast.info('Preparing PDF export...');
      
      await exportToPdf({
        state,
        filename: `${state.mainTitle || 'my-comic'}.pdf`,
      });
      
      toast.success('Comic exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleNavigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPageNumber > 1) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPageNumber - 1 });
    } else if (direction === 'next' && currentPageNumber < totalPages) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPageNumber + 1 });
    }
  };
  
  if (!currentPage) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      {showOverlay && <ProgressOverlay />}
      
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold comic-font text-comic-primary">
            {state.mainTitle || 'Your Comic'}
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate('/page-review')}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Page Review
            </Button>
            
            <Button onClick={handleAutoGenerateAll} disabled={showOverlay || isExporting}>
              <Wand2 className="mr-1 h-4 w-4" />
              Auto-generate All
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <FileDown className="mr-1 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">
                Page {currentPageNumber} of {totalPages}: {currentPage.title}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigatePage('prev')}
                  disabled={currentPageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigatePage('next')}
                  disabled={currentPageNumber >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="content">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="key-points">Key Points</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Page Content</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateContent}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </Button>
                    </div>
                    
                    <Textarea
                      value={currentPage.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Enter or generate content for this page..."
                      className="min-h-[300px]"
                    />
                  </TabsContent>
                  
                  <TabsContent value="key-points">
                    <div className="space-y-2">
                      <h3 className="font-medium">Key Developments</h3>
                      {currentPage.keyDevelopments && currentPage.keyDevelopments.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {currentPage.keyDevelopments.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No key developments yet. Generate content first.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Images</h3>
            <div className="space-y-4">
              { console.log(currentPageNumber)}
              {currentPageNumber && currentPage.imagePrompts && currentPage.imagePrompts.length > 0 ? (
                currentPage.imagePrompts.map((prompt, idx) => (
                  <ImagePanel
                    key={idx}
                    pageNumber={currentPageNumber}
                    panelNumber={idx + 1}
                    prompt={prompt}
                  />
                ))
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground mb-2">
                    No image prompts available
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                  >
                    Generate Content First
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentGenerator;
