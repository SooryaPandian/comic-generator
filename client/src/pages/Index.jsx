
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, FileDown, Pencil } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-comic-background to-white">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 comic-font text-comic-primary animate-bounce-slow">
            Comic Creator Express
          </h1>
          <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
            Create amazing comics with AI-powered content and image generation.
            Design your story, generate panels, and export your creation!
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-comic-border">
            <h2 className="text-2xl font-bold mb-4 text-comic-secondary flex items-center">
              <Pencil className="mr-2" /> Manual Creation
            </h2>
            <p className="mb-4">
              Take full creative control by manually crafting each element of your comic.
              Enter your titles, write content, and generate images with specific prompts.
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>Write your own storyline and dialogue</li>
              <li>Design unique characters and settings</li>
              <li>Generate custom images for each panel</li>
              <li>Full control over every page's content</li>
            </ul>
            <Button 
              onClick={() => navigate('/title-input')} 
              className="w-full"
            >
              Start Manual Creation
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-comic-border">
            <h2 className="text-2xl font-bold mb-4 text-comic-primary flex items-center">
              <Zap className="mr-2" /> Auto Generation
            </h2>
            <p className="mb-4">
              Let AI do the heavy lifting! Provide a basic concept, and our system will
              automatically generate a complete comic with storyline, page content, and images.
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>AI-generated storylines and character development</li>
              <li>Automatic page content with dramatic flow</li>
              <li>Consistent art style across panels</li>
              <li>Quick generation of complete comics</li>
            </ul>
            <Button
              onClick={() => navigate('/title-input')}
              className="w-full"
              variant="secondary"
            >
              Try Auto Generation
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 comic-font">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="bg-comic-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Enter Comic Details</h3>
              <p className="text-sm text-muted-foreground">
                Start by providing a title, description, and character information.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="bg-comic-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Review Page Titles</h3>
              <p className="text-sm text-muted-foreground">
                Edit and refine the title of each page in your comic.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="bg-comic-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Generate Content & Images</h3>
              <p className="text-sm text-muted-foreground">
                Create story content and AI-generated images for each panel.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => navigate('/title-input')}
            size="lg"
            className="animate-pulse"
          >
            <BookOpen className="mr-2" />
            Start Creating Your Comic Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
