
import React, { useState, useRef } from 'react';
import { CharacterUploader } from './CharacterUploader';
import { Character } from '../types';
import { downloadTextFile } from '../utils/fileUtils';
import { processTextTask } from '../services/geminiService';

interface ControlPanelProps {
  onGenerate: (settings: { characters: Character[]; prompts: string[]; aspectRatio: string; imageStyle: string; model: string; textModel: string; }) => void;
  isLoading: boolean;
}

const initialCharacters: Character[] = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  name: `Character ${i + 1}`,
  file: null,
  previewUrl: null,
  mediaType: null,
  isSelected: false,
  referenceFrames: [],
  isProcessing: false,
  currentFrameIndex: 0,
}));

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isLoading }) => {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [imageStyle, setImageStyle] = useState('Match Reference');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-image');
  const [textModel, setTextModel] = useState('gemini-3-flash-preview');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [customAspectRatio, setCustomAspectRatio] = useState('');
  const [prompts, setPrompts] = useState('');
  const [isTextProcessing, setIsTextProcessing] = useState(false);
  const promptsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptFileInputRef = useRef<HTMLInputElement>(null);
  const [copyButtonText, setCopyButtonText] = useState('คัดลอก');

  const handleCharacterUpdate = (updatedCharacter: Character) => {
    setCharacters(prev => prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
  };

  const handleInsertCharacterName = (name: string) => {
    const textarea = promptsTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const nameWithSpaces = `${name}`; 
    
    const newText = text.substring(0, start) + nameWithSpaces + text.substring(end);
    
    setPrompts(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + nameWithSpaces.length;
    }, 0);
  };

  const handleOpenFileClick = () => {
    promptFileInputRef.current?.click();
  };

  const handlePromptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setPrompts(text);
      }
    };
    reader.readAsText(file);
    if(event.target) event.target.value = '';
  };

  const handleCopyPrompts = () => {
    if (!prompts || !navigator.clipboard) return;
    navigator.clipboard.writeText(prompts).then(() => {
      setCopyButtonText('คัดลอกแล้ว!');
      setTimeout(() => setCopyButtonText('คัดลอก'), 2000);
    });
  };

  const handleSavePrompts = () => {
    if (!prompts) return;
    downloadTextFile(prompts, 'prompts.txt');
  };

  const handleClearPrompts = () => {
    setPrompts('');
  };

  // จัดการงานประมวลผลข้อความ (Text Reasoning)
  const handleTextTask = async (task: 'idea' | 'polish' | 'translate' | 'caption') => {
    if (!prompts.trim()) {
      alert("กรุณากรอกข้อความก่อนใช้เครื่องมือช่วยเขียน");
      return;
    }

    setIsTextProcessing(true);
    try {
      const result = await processTextTask(prompts, task, textModel);
      setPrompts(result);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการประมวลผลข้อความ: " + (error instanceof Error ? error.message : "Error"));
    } finally {
      setIsTextProcessing(false);
    }
  };

  const handleAddFramePrompt = () => setPrompts("เขียนกรอบรูปรอบภาพเป็นเส้นสีแดงบางๆ แค่พอมองเห็น ให้ชิดขอบที่สุด");
  const handleThaiAdPrompt = () => setPrompts("สร้างภาพโฆษณาขนมเปี๊ยะสายรุ้ง Character 2 โดยมี Character 1 ใส่ชุดนักผจญภัย เป็น presenter พร้อมลูกเป็ดเหลืองน่ารักมากตัวโต และนกกาฮัง (นกเงือกใหญ่ หรือนกกก) ประกอบภาพ ใช้ตัวหนังสือภาษาอังกฤษเท่านั้น ห้ามมีภาษาไทยในภาพ ยกเว้นป้ายชื่อร้าน Character 3 เท่านั้นที่เป็นภาษาอะไรก็ได้ตามภาพอ้างอิง ช่องทางติดต่อ : 'TEL & LINE : 0812345788' สถานที่ : สวนสัตว์เปิดเขาเขียว เวลา : บ่าย อารมณ์ภาพ : สดชื่นแจ่มใส สร้างภาพและข้อความประกอบภาพให้สวยงาม น่าสนใจ โดดเด่น หรูหรา แปลกตา น่าประทับใจ มีป้ายชื่อร้าน Character 3 ที่โดดเด่น ข้อความในภาพได้แก่ ช่องทางติดต่อ, คำขวัญที่น่าประทับใจประกอบภาพ ไม่ต้องระบุรายละเอียดอื่นๆ เช่น สถานที่ เวลา ฯลฯ ในภาพ โดยเน้นข้อความทุกตัวให้ตัวใหญ่ โดดเด่น อ่านง่าย ชัดเจน สะกดถูกต้องทุกตัวอักษร");
  const handleAdPrompt = () => setPrompts("สร้างภาพโฆษณาขนมเปี๊ยะสายรุ้ง Character 2 โดยมี Character 1 ใส่ชุดผจญภัย เป็น presenter พร้อมลูกเป็ดเหลืองน่ารักมากตัวโต และนกกาฮัง (นกเงือกใหญ่ หรือนกกก) ประกอบภาพ ใช้ตัวหนังสือ​ภาษาอังกฤษ​เท่านั้น ห้ามมีภาษาไทยในภาพ ชื่อร้าน : Delight Sweets ช่องทางติดต่อ : 'TEL & LINE : 0812345788' สถานที่ : สวนสัตว์เปิดเขาเขียว เวลา : บ่าย อารมณ์ภาพ : สดชื่นแจ่มใส สร้างภาพและข้อความประกอบภาพให้สวยงาม น่าสนใจ โดดเด่น หรูหรา แปลกตา น่าประทับใจ ข้อความในภาพได้แก่ ชื่อร้าน, ช่องทางติดต่อ, คำขวัญที่น่าประทับใจประกอบภาพ ไม่ต้องระบุรายละเอียดอื่นๆ เช่น สถานที่ เวลา ฯลฯ ในภาพ โดยเน้นข้อความทุกตัวให้ตัวใหญ่ โดดเด่น อ่านง่าย ชัดเจน สะกดถูกต้องทุกตัวอักษร");
  
  const handleGenerateClick = () => {
    const finalAspectRatio = aspectRatio === 'Custom' ? customAspectRatio : aspectRatio;
    const promptList = prompts.split('\n').map(p => p.trim()).filter(p => p);
    onGenerate({ characters, prompts: promptList, aspectRatio: finalAspectRatio, imageStyle, model: selectedModel, textModel });
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-6">
      <input type="file" ref={promptFileInputRef} onChange={handlePromptFileChange} accept=".txt" className="hidden" />
      
      <div>
        <h2 className="text-xl font-semibold mb-1 border-b border-gray-700 pb-2">Character References</h2>
        <p className="text-xs text-gray-400 mb-4">Upload an image or a short video (under 10s) for each character.</p>
        <div className="grid grid-cols-2 gap-4">
          {characters.map(character => (
            <CharacterUploader key={character.id} character={character} onUpdate={handleCharacterUpdate} onInsertName={handleInsertCharacterName} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="text-model-select" className="block text-sm font-semibold mb-2">Text Reasoning Model</label>
          <select
            id="text-model-select"
            value={textModel}
            onChange={(e) => setTextModel(e.target.value)}
            className="w-full p-2 text-xs bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
<option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
<option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
<option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
<option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
<option value="gemini-flash-latest">Gemini Flash Latest</option>
<option value="gemini-flash-lite-latest">Gemini Flash Lite Latest</option>
<option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
<option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>

        <div>
          <label htmlFor="model-select" className="block text-sm font-semibold mb-2">Image Model</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 text-xs bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
<option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (High Quality)</option>
<option value="gemini-3-pro-image-preview">Gemini 3.0 Pro Image (Premium)</option>
<option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Standard)</option>
<option value="imagen-4.0-generate-001">Imagen 4.0</option>
<option value="gemini-flash-image-latest">Gemini Flash Image Latest</option>
<option value="gemini-pro-image-latest">Gemini Pro Image Latest</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="image-style" className="block text-lg font-semibold mb-2">Image Style</label>
        <select
          id="image-style"
          value={imageStyle}
          onChange={(e) => setImageStyle(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="Match Reference">Match Reference Style</option>
          <option value="Cartoon">Cartoon</option>
          <option value="Disney Cartoon">Disney Cartoon</option>
          <option value="ลายไทย">ลายไทย</option>
          <option value="Anime / Manga">Anime / Manga</option>
          <option value="Realistic">Realistic</option>
          <option value="Fantasy Art">Fantasy Art</option>
          <option value="Pixel Art">Pixel Art</option>
          <option value="Watercolor">Watercolor</option>
          <option value="Black & White (Laser Printer)">Black &amp; White (Laser Printer)</option>
        </select>
      </div>

      <div>
        <label htmlFor="aspect-ratio" className="block text-lg font-semibold mb-2">Aspect Ratio</label>
        <select
          id="aspect-ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option>16:9</option>
          <option>9:16</option>
          <option>1:1</option>
          <option>4:3</option>
          <option>Custom</option>
        </select>
        {aspectRatio === 'Custom' && (
          <input
            type="text"
            placeholder="e.g., 21:9"
            value={customAspectRatio}
            onChange={(e) => setCustomAspectRatio(e.target.value)}
            className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="prompts" className="block text-lg font-semibold">Prompt List</label>
          <div className="flex items-center gap-1">
            <button onClick={handleOpenFileClick} disabled={isLoading} className="px-2 py-1 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-red-600 transition-colors">เปิด</button>
            <button onClick={handleCopyPrompts} disabled={!prompts || isLoading} className="px-2 py-1 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-red-600 transition-colors">{copyButtonText}</button>
            <button onClick={handleSavePrompts} disabled={!prompts || isLoading} className="px-2 py-1 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-red-600 transition-colors">บันทึก</button>
            <button onClick={handleClearPrompts} disabled={!prompts || isLoading} className="px-2 py-1 text-[10px] bg-gray-700 text-gray-300 rounded hover:bg-red-800 transition-colors">ล้าง</button>
          </div>
        </div>

        {/* ปุ่มเครื่องมือช่วยเขียน (Text Tasks) */}
        <div className="grid grid-cols-4 gap-1 mb-2">
            <button 
                onClick={() => handleTextTask('idea')} 
                disabled={isTextProcessing || isLoading} 
                className="py-1 text-[10px] bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded border border-blue-600/30 transition-all flex items-center justify-center gap-1"
            >
                {isTextProcessing ? <span className="animate-spin text-[8px]">●</span> : 'Idea'}
            </button>
            <button 
                onClick={() => handleTextTask('polish')} 
                disabled={isTextProcessing || isLoading} 
                className="py-1 text-[10px] bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded border border-purple-600/30 transition-all flex items-center justify-center gap-1"
            >
                {isTextProcessing ? <span className="animate-spin text-[8px]">●</span> : 'Polish'}
            </button>
            <button 
                onClick={() => handleTextTask('translate')} 
                disabled={isTextProcessing || isLoading} 
                className="py-1 text-[10px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded border border-indigo-600/30 transition-all flex items-center justify-center gap-1"
            >
                {isTextProcessing ? <span className="animate-spin text-[8px]">●</span> : 'Translate'}
            </button>
            <button 
                onClick={() => handleTextTask('caption')} 
                disabled={isTextProcessing || isLoading} 
                className="py-1 text-[10px] bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white rounded border border-pink-600/30 transition-all flex items-center justify-center gap-1"
            >
                {isTextProcessing ? <span className="animate-spin text-[8px]">●</span> : 'Caption'}
            </button>
        </div>

        <textarea
          id="prompts"
          ref={promptsTextareaRef}
          rows={10}
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          placeholder="ระบุฉากที่คุณต้องการที่นี่..."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500 text-sm"
        />
        
        <div className="flex gap-2 mt-3">
          <button onClick={handleThaiAdPrompt} disabled={isLoading} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-1 rounded transition-colors border border-gray-600 text-[10px] sm:text-xs">ภาพโฆษณา</button>
          <button onClick={handleAdPrompt} disabled={isLoading} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-1 rounded transition-colors border border-gray-600 text-[10px] sm:text-xs">Advertise</button>
          <button onClick={handleAddFramePrompt} disabled={isLoading} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-1 rounded transition-colors border border-gray-600 text-[10px] sm:text-xs">Add Frame</button>
        </div>
      </div>

      <button
        onClick={handleGenerateClick}
        disabled={isLoading || isTextProcessing}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:bg-red-900 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-lg transform hover:scale-105 disabled:scale-100"
      >
        {isLoading ? 'Generating...' : 'Generate All Images'}
      </button>
    </div>
  );
};
