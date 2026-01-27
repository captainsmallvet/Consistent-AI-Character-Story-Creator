
import React, { useRef } from 'react';
import { Character } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { FilmIcon } from './icons/FilmIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { extractFramesFromVideo } from '../utils/videoUtils';
import { fileToBase64 } from '../utils/fileUtils';

interface CharacterUploaderProps {
  character: Character;
  onUpdate: (character: Character) => void;
  onInsertName: (name: string) => void;
}

export const CharacterUploader: React.FC<CharacterUploaderProps> = ({ character, onUpdate, onInsertName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processFile = async (file: File) => {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      // Revoke previous object URL if it exists
      if (character.previewUrl) {
        URL.revokeObjectURL(character.previewUrl);
      }

      // Create a temporary URL for processing
      const tempUrl = URL.createObjectURL(file);

      onUpdate({
        ...character,
        isProcessing: true,
        file,
        mediaType,
        previewUrl: tempUrl,
        currentFrameIndex: 0,
      });

      try {
        let frames: { data: string; mimeType: string; }[] = [];
        if (mediaType === 'video') {
          frames = await extractFramesFromVideo(file);
          // Important: Revoke the video URL immediately after extraction to free system resources
          URL.revokeObjectURL(tempUrl);
          
          onUpdate({
            ...character,
            file, 
            mediaType,
            previewUrl: null,
            isSelected: true,
            referenceFrames: frames,
            isProcessing: false,
            currentFrameIndex: 0,
          });
        } else {
          const base64Data = await fileToBase64(file);
          frames = [{ data: base64Data, mimeType: file.type }];
          URL.revokeObjectURL(tempUrl);

           onUpdate({
            ...character,
            file, 
            mediaType,
            previewUrl: null,
            isSelected: true,
            referenceFrames: frames,
            isProcessing: false,
            currentFrameIndex: 0,
          });
        }

      } catch(error) {
        console.error("Error processing file:", error);
        alert(error instanceof Error ? error.message : "Failed to process file.");
        handleRemoveMedia(); // Revert on error
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveMedia = () => {
    if (character.previewUrl) {
      URL.revokeObjectURL(character.previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUpdate({
      ...character,
      file: null,
      previewUrl: null,
      mediaType: null,
      isSelected: false,
      referenceFrames: [],
      isProcessing: false,
      currentFrameIndex: 0,
    });
  };

  const handleNextFrame = (e: React.MouseEvent) => {
    e.stopPropagation();
    const totalFrames = character.referenceFrames.length;
    if (totalFrames <= 1) return;
    const nextIndex = (character.currentFrameIndex + 1) % totalFrames;
    onUpdate({ ...character, currentFrameIndex: nextIndex });
  };

  // Determine the source to display
  const displaySrc = character.previewUrl 
    ? character.previewUrl
    : (character.referenceFrames.length > 0 
        ? `data:${character.referenceFrames[character.currentFrameIndex].mimeType};base64,${character.referenceFrames[character.currentFrameIndex].data}`
        : null);

  const hasMultipleFrames = character.referenceFrames.length > 1;

  const handleMainClick = () => {
      if (!character.isProcessing && !displaySrc) {
          fileInputRef.current?.click();
      }
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="relative aspect-square w-full bg-gray-700 rounded-md flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-500 hover:border-red-500 transition-colors group overflow-hidden"
        onClick={handleMainClick}
        title={hasMultipleFrames ? "Click right side to cycle frames" : "Click to Upload media"}
      >
        {character.isProcessing ? (
           <div className="absolute inset-0 bg-black z-20 flex items-center justify-center overflow-hidden rounded-md">
             {character.mediaType === 'video' && character.previewUrl ? (
                <video 
                  src={character.previewUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover opacity-50"
                />
             ) : null}
             <div className="absolute inset-0 flex items-center justify-center">
                 <SpinnerIcon className="w-10 h-10" />
             </div>
           </div>
        ) : (
          displaySrc && (
            <>
              <img 
                  src={displaySrc} 
                  alt={`${character.name} frame`} 
                  className="w-full h-full object-cover rounded-md" 
              />
              
              {/* Overlay for frame cycling (Right side) */}
              {hasMultipleFrames && (
                  <div 
                      className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer hover:bg-white/5 transition-colors group/arrow flex items-center justify-end pr-2"
                      onClick={handleNextFrame}
                      title="Click to view next extracted frame"
                  >
                      {/* Visual Indicator for Cycling */}
                      <div className="bg-black/40 text-white/80 p-1.5 rounded-full backdrop-blur-sm group-hover/arrow:bg-black/70 group-hover/arrow:text-white transition-all transform group-hover/arrow:scale-110">
                        <ChevronRightIcon className="w-6 h-6" />
                      </div>
                  </div>
              )}

               {/* Overlay for re-uploading (Left side if frames exist, or full if single) */}
               <div 
                  className={`absolute top-0 left-0 h-full z-10 cursor-pointer hover:bg-white/5 transition-colors ${hasMultipleFrames ? 'w-1/2' : 'w-full'}`}
                  onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                  }}
                  title="Click to upload new file"
              />
              
              {character.mediaType === 'video' && (
                  <div className="absolute bottom-1 right-1 bg-black/60 p-1 rounded flex items-center gap-1 z-0 pointer-events-none">
                      <FilmIcon className="w-3 h-3 text-white" />
                      {hasMultipleFrames && (
                          <span className="text-[10px] text-white font-mono">
                              {character.currentFrameIndex + 1}/{character.referenceFrames.length}
                          </span>
                      )}
                  </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMedia();
                }}
                className="absolute top-1 right-1 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                aria-label="Remove media"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          )
        )}
        
        {!displaySrc && !character.isProcessing && (
            <div className="text-center text-gray-400 pointer-events-none">
                <PlusIcon className="w-8 h-8 mx-auto mb-1" />
                <span className="text-sm">Upload Media</span>
            </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, video/mp4, video/webm, video/quicktime"
      />
      <div className="relative">
        <input
          type="text"
          value={character.name}
          onChange={(e) => onUpdate({ ...character, name: e.target.value })}
          className="w-full text-sm p-1.5 bg-gray-900 border border-gray-600 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-red-500 pr-24"
        />
        <button
          onClick={() => onInsertName(character.name)}
          disabled={!character.isSelected}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-red-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          aria-label={`Insert ${character.name} into prompt`}
          title={`Insert ${character.name} into prompt`}
        >
          อ้างอิง
        </button>
      </div>
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          id={`char-select-${character.id}`}
          checked={character.isSelected}
          onChange={(e) => onUpdate({ ...character, isSelected: e.target.checked })}
          disabled={!character.file}
          className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 disabled:opacity-50"
        />
        <label htmlFor={`char-select-${character.id}`} className="ml-2 text-sm font-medium text-gray-300">Include</label>
      </div>
    </div>
  );
};
