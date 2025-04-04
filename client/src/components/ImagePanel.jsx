import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download } from 'lucide-react';
import { useComicContext } from '@/context/ComicContext';
import API from '@/services/api';
import { toast } from 'sonner';

  const ImagePanel = ({ pageNumber, panelNumber, prompt, className = '' }) => {
  const { state, dispatch } = useComicContext();
  const [isGenerating, setIsGenerating] = useState(false);
 
  const currentImage = state.generatedImages?.[pageNumber]?.[panelNumber] || null;


  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const response = await API.generateImage({
        prompt,
        pageNumber,
        panelNumber,
        style: 'comic book'
      });
      
      if (response.success && response.data) {
        dispatch({
          type: 'ADD_GENERATED_IMAGE',
          payload: { url: response.data,pageNumber,panelNumber}
        });
        toast.success('Image generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
  
    // Convert Base64 to a Blob (JPEG format)
    const byteCharacters = atob(currentImage);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comic-page-${pageNumber}-panel-${panelNumber}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // Cleanup Blob URL
    URL.revokeObjectURL(link.href);
  
    toast.success('Image downloaded successfully');
  };
  
  return (
    <Card className={`overflow-hidden flex flex-col ${className}`}>
      <div className="p-2 bg-comic-muted text-sm font-medium truncate">
        Panel {panelNumber}: {prompt}
      </div>
      
      <div className="relative aspect-[3/2] bg-muted flex items-center justify-center overflow-hidden">
        {isGenerating ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
            <div className="absolute text-sm text-center">
              Generating image...
            </div>
          </div>
        ) : currentImage ?(
          <img
            src={`data:image/png;base64,${currentImage}`} // Decode Base64 image
            alt={`Comic page ${pageNumber}, panel ${panelNumber}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4">
            <p className="mb-2">No image yet</p>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              Generate
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-2 flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isGenerating} 
          onClick={handleGenerate}
          className="flex-1"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Regenerate
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!currentImage} 
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </Card>
  );
};

export default ImagePanel;
