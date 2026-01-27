
import React from 'react';
import { GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';
import { downloadImage } from '../utils/fileUtils';

interface ResultsDisplayProps {
  images: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onPreview: (imageUrl: string) => void;
  onExpand: (image: GeneratedImage) => void;
  onAddFrame: (image: GeneratedImage) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, isLoading, error, onPreview, onExpand, onAddFrame }) => {

  const handleDownloadAll = () => {
    images.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image.imageDataUrl, image.filename);
      }, index * 300);
    });
  };

  const hasContent = images.length > 0;

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg min-h-[calc(100vh-10rem)]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h2 className="text-xl font-semibold">Results</h2>
        {hasContent && (
          <button 
            onClick={handleDownloadAll}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Download All
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading && !hasContent && (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <svg className="animate-spin h-10 w-10 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg">Generating your story... please wait.</p>
        </div>
      )}

      {!isLoading && !hasContent && !error && (
         <div className="flex items-center justify-center h-96 text-gray-500">
            <p>Your generated images will appear here.</p>
         </div>
      )}

      {hasContent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {images.map(image => (
            <ImageCard 
              key={image.id} 
              image={image} 
              onPreview={onPreview} 
              onExpand={onExpand} 
              onAddFrame={onAddFrame}
            />
          ))}
        </div>
      )}
    </div>
  );
};