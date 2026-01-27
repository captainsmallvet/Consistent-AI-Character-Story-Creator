
import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Character, GeneratedImage } from './types';
import { generateStoryImage, expandImage, addFrameToImage } from './services/geminiService';
import { getFormattedDate } from './utils/fileUtils';
import { ExpandModal } from './components/ExpandModal';
import { ApiKeyManager } from './components/ApiKeyManager';

function App() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [expandingImage, setExpandingImage] = useState<GeneratedImage | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  // ตรวจสอบความปลอดภัยและการเลือก API Key ตามแนวทางของ Gemini API สำหรับโมเดลขั้นสูง
  const ensureApiKey = useCallback(async (model: string) => {
    // สำหรับ gemini-3-pro-image-preview ต้องให้ผู้ใช้เลือก API Key ของตนเอง
    if (model === 'gemini-3-pro-image-preview') {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        if (!(await aistudio.hasSelectedApiKey())) {
          await aistudio.openSelectKey();
          // อ้างอิงตามแนวทาง: ให้ถือว่าการเลือกสำเร็จหลังเรียกใช้ openSelectKey() เพื่อลดปัญหา Race Condition
        }
      }
    }
  }, []);

  const handleGenerate = useCallback(async (settings: {
    characters: Character[];
    prompts: string[];
    aspectRatio: string;
    imageStyle: string;
    model: string;
    textModel: string;
  }) => {
    const { characters, prompts, aspectRatio, imageStyle, model, textModel } = settings;
    
    if (prompts.length === 0 || prompts[0].trim() === '') {
        setError("กรุณากรอก Prompt อย่างน้อย 1 รายการ");
        return;
    }
      
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      await ensureApiKey(model);
    } catch (e) {
      console.warn("API Key selection skipped or failed", e);
    }

    const selectedCharacters = characters.filter(c => c.isSelected && c.file);
    const dateStr = getFormattedDate();

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (!prompt.trim()) continue;

      try {
        const imageDataUrl = await generateStoryImage(prompt, selectedCharacters, aspectRatio, imageStyle, model);
        const filename = `${String(i + 1).padStart(3, '0')}_${dateStr}.png`;
        
        setGeneratedImages(prev => [
          ...prev,
          { id: self.crypto.randomUUID(), imageDataUrl, prompt, filename }
        ]);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
        
        // จัดการกรณี Requested entity was not found โดยให้ผู้ใช้เลือก Key ใหม่
        if (errorMessage.includes("Requested entity was not found")) {
            const aistudio = (window as any).aistudio;
            if (aistudio && typeof aistudio.openSelectKey === 'function') {
                await aistudio.openSelectKey();
            }
        }
        
        setError(`ไม่สามารถสร้างภาพสำหรับ prompt "${prompt}": ${errorMessage}`);
        break; 
      }
    }

    setIsLoading(false);
  }, [ensureApiKey]);
  
  const handleExpandRequest = useCallback((image: GeneratedImage) => {
    setExpandingImage(image);
  }, []);

  const handleCloseExpandModal = useCallback(() => {
    if (!isExpanding) {
      setExpandingImage(null);
    }
  }, [isExpanding]);

  const handleConfirmExpand = useCallback(async (newAspectRatio: string) => {
    if (!expandingImage) return;

    setIsExpanding(true);
    setError(null);
    const originalImage = expandingImage;

    try {
      const newImageDataUrl = await expandImage(originalImage.imageDataUrl, newAspectRatio, originalImage.prompt);
      const dateStr = getFormattedDate();
      
      const newImage: GeneratedImage = {
        id: self.crypto.randomUUID(),
        imageDataUrl: newImageDataUrl,
        prompt: `Expanded to ${newAspectRatio} from: "${originalImage.prompt}"`,
        filename: `${originalImage.filename.split('.png')[0]}_expanded_${newAspectRatio.replace(':', 'x')}.png`
      };

      setGeneratedImages(prevImages => {
        const originalIndex = prevImages.findIndex(img => img.id === originalImage.id);
        if (originalIndex === -1) {
          return [...prevImages, newImage]; 
        }
        const newImages = [...prevImages];
        newImages.splice(originalIndex + 1, 0, newImage);
        return newImages;
      });
      setExpandingImage(null);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during expansion.';
      setError(`Failed to expand image: ${errorMessage}`);
      setExpandingImage(null);
    } finally {
      setIsExpanding(false);
    }
  }, [expandingImage]);

  const handleAddFrameToImage = useCallback(async (image: GeneratedImage) => {
    setIsLoading(true);
    setError(null);

    try {
      const newImageDataUrl = await addFrameToImage(image.imageDataUrl);
      
      const newImage: GeneratedImage = {
        id: self.crypto.randomUUID(),
        imageDataUrl: newImageDataUrl,
        prompt: `With Red Frame: "${image.prompt}"`,
        filename: `${image.filename.split('.png')[0]}_framed.png`
      };

      setGeneratedImages(prevImages => {
        const originalIndex = prevImages.findIndex(img => img.id === image.id);
        if (originalIndex === -1) {
          return [...prevImages, newImage];
        }
        const newImages = [...prevImages];
        newImages.splice(originalIndex + 1, 0, newImage);
        return newImages;
      });

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while adding frame.';
      setError(`Failed to add frame: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePreview = useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
  }, []);

  const closePreview = () => {
    setPreviewImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <ApiKeyManager />

      <header className="py-4 px-8 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-[66px] z-10 transition-all">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
          Consistent AI Character Story Creator
        </h1>
      </header>

      <main className="flex flex-col lg:flex-row gap-8 p-4 md:p-8 flex-grow">
        <div className="lg:w-1/3 xl:w-1/4 lg:sticky lg:top-[150px] self-start">
          <ControlPanel onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        <div className="flex-1">
          <ResultsDisplay 
            images={generatedImages} 
            isLoading={isLoading} 
            error={error} 
            onPreview={handlePreview}
            onExpand={handleExpandRequest}
            onAddFrame={handleAddFrameToImage}
          />
        </div>
      </main>

      {previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewImageUrl} alt="Generated preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"/>
            <button 
              onClick={closePreview}
              className="absolute -top-4 -right-4 bg-white text-black rounded-full h-10 w-10 flex items-center justify-center text-2xl font-bold hover:bg-red-500 hover:text-white transition-transform transform hover:scale-110"
              aria-label="Close preview"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {expandingImage && (
        <ExpandModal
          image={expandingImage}
          onClose={handleCloseExpandModal}
          onExpand={handleConfirmExpand}
          isLoading={isExpanding}
        />
      )}
    </div>
  );
}

export default App;
