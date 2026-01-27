import React from 'react';
import { GeneratedImage } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ExpandModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onExpand: (aspectRatio: string) => void;
  isLoading: boolean;
}

const aspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export const ExpandModal: React.FC<ExpandModalProps> = ({ image, onClose, onExpand, isLoading }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md m-4 text-white relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Expand Image</h2>
        
        <div className="mb-4 aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            <img src={image.imageDataUrl} alt="Original to expand" className="max-w-full max-h-48 object-contain"/>
        </div>

        <p className="text-center text-gray-300 mb-4">Select a new aspect ratio to expand the image to:</p>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-24">
                <SpinnerIcon className="w-10 h-10 mb-2" />
                <p>Expanding image...</p>
            </div>
        ) : (
            <div className="grid grid-cols-5 gap-3">
                {aspectRatios.map(ar => (
                    <button
                        key={ar}
                        onClick={() => onExpand(ar)}
                        className="bg-gray-700 hover:bg-red-600 text-white font-semibold py-3 px-2 rounded-lg transition-colors duration-200 text-sm"
                    >
                        {ar}
                    </button>
                ))}
            </div>
        )}
        
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-black rounded-full h-8 w-8 flex items-center justify-center text-2xl font-bold hover:bg-red-500 hover:text-white transition-transform transform hover:scale-110 disabled:opacity-50"
          aria-label="Close"
          disabled={isLoading}
        >
          &times;
        </button>
      </div>
    </div>
  );
};
