
import React from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { downloadImage } from '../utils/fileUtils';
import { ExpandIcon } from './icons/ExpandIcon';
import { FrameIcon } from './icons/FrameIcon';

interface ImageCardProps {
  image: GeneratedImage;
  onPreview: (imageUrl: string) => void;
  onExpand: (image: GeneratedImage) => void;
  onAddFrame: (image: GeneratedImage) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onPreview, onExpand, onAddFrame }) => {
  return (
    <div className="flex flex-col rounded-lg shadow-md bg-gray-800 overflow-hidden border border-gray-700 h-full">
      {/* Image Section - Click to Preview */}
      <div 
        className="relative group cursor-pointer bg-gray-900 flex-grow flex items-center justify-center overflow-hidden"
        onClick={() => onPreview(image.imageDataUrl)}
      >
        <img 
          src={image.imageDataUrl} 
          alt={image.prompt} 
          className="w-full h-auto max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-105" 
        />
        {/* Prompt Overlay on Hover (Bottom of image area) */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <p className="text-[10px] text-gray-200 line-clamp-2" title={image.prompt}>{image.prompt}</p>
        </div>
      </div>

      {/* Action Buttons Section (Below Image) */}
      <div className="grid grid-cols-4 divide-x divide-gray-700 bg-gray-800 border-t border-gray-700 shrink-0">
        <button 
          onClick={() => onPreview(image.imageDataUrl)}
          className="flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-700 transition-colors text-gray-400 hover:text-blue-400 gap-1 group h-full"
          title="Preview Full Size"
        >
          <EyeIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight text-center">ภาพใหญ่</span>
        </button>

        <button 
          onClick={() => onExpand(image)}
          className="flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-700 transition-colors text-gray-400 hover:text-green-400 gap-1 group h-full"
          title="Expand Image"
        >
          <ExpandIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight text-center">ปรับสัดส่วน</span>
        </button>

        <button 
          onClick={() => onAddFrame(image)}
          className="flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400 gap-1 group h-full"
          title="Add Red Frame"
        >
          <FrameIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight text-center">ตีกรอบ</span>
        </button>

        <button 
          onClick={() => downloadImage(image.imageDataUrl, image.filename)}
          className="flex flex-col items-center justify-center py-3 px-1 hover:bg-gray-700 transition-colors text-gray-400 hover:text-yellow-400 gap-1 group h-full"
          title="Download to Device"
        >
          <DownloadIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight text-center">Download</span>
        </button>
      </div>
    </div>
  );
};
