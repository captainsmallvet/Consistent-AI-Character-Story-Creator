
export interface Character {
  id: number;
  name: string;
  file: File | null;
  previewUrl: string | null;
  mediaType: 'image' | 'video' | null;
  isSelected: boolean;
  referenceFrames: { data: string; mimeType: string }[];
  isProcessing: boolean;
  currentFrameIndex: number;
}

export interface GeneratedImage {
  id: string;
  imageDataUrl: string;
  prompt: string;
  filename: string;
}