
import React from 'react';
import { useComicContext } from '@/context/ComicContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const ProgressOverlay = () => {
  const { state } = useComicContext();
  const { currentPage, pages, generationStatus } = state;
  
  const progress = pages.length > 0 ? ((currentPage || 1) / pages.length) * 100 : 0;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-[90%] max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl mb-1 comic-font text-comic-primary">
              Generating Your Comic
            </h3>
            <p className="text-muted-foreground">
              {generationStatus === 'generating' 
                ? `Processing page ${currentPage || 1} of ${pages.length}...` 
                : 'Generation complete!'}
            </p>
          </div>
          
          <Progress value={progress} className="h-2 mb-2" />
          
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Page {currentPage || 1}</span>
            <span>Total: {pages.length} pages</span>
          </div>
          
          <div className="mt-6 mb-2 text-center text-sm text-muted-foreground">
            {generationStatus === 'generating'
              ? 'Please wait while we generate your comic...'
              : 'All pages have been generated!'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressOverlay;
