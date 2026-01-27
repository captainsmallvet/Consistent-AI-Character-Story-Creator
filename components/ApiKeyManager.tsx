import React, { useState, useEffect, useRef } from 'react';

export const ApiKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial load: check localStorage -> global process.env -> show placeholder
    const storedKey = localStorage.getItem('gemini_api_key');
    const envKey = (window as any).process?.env?.API_KEY;

    if (storedKey && storedKey.trim() !== '') {
      setApiKey(storedKey);
      if ((window as any).process?.env) {
        (window as any).process.env.API_KEY = storedKey;
      }
    } else if (envKey && envKey !== 'undefined' && envKey !== 'PLACEHOLDER_API_KEY' && envKey !== '') {
      setApiKey(envKey);
    } else {
      setApiKey('no API key');
    }
  }, []);

  const handleSend = () => {
    const val = apiKey.trim();
    if (val && val !== 'no API key' && val !== '') {
      localStorage.setItem('gemini_api_key', val);
      if ((window as any).process?.env) {
        (window as any).process.env.API_KEY = val;
      }
      alert('API Key updated and saved to localStorage.');
    } else {
      alert('Please enter a valid API key.');
    }
  };

  const handleCopy = () => {
    const val = apiKey === 'no API key' ? '' : apiKey;
    if (val) {
      navigator.clipboard.writeText(val).then(() => {
        alert('API Key copied to clipboard.');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    if ((window as any).process?.env) {
      (window as any).process.env.API_KEY = '';
    }
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (apiKey === 'no API key') {
      setApiKey('');
    }
  };

  const handleBlur = () => {
    if (apiKey.trim() === '') {
      setApiKey('no API key');
    }
  };

  return (
    <div className="w-full bg-[#0d1117] border-b border-gray-800 flex flex-col z-[100] sticky top-0 shadow-2xl font-sans">
      {/* Top Controls Row */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/60">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${apiKey && apiKey !== 'no API key' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'} transition-all duration-500`}></span>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest select-none">
            API key :
          </label>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSend} 
            className="text-[10px] font-black bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition-all active:scale-95 shadow-lg uppercase"
          >
            SEND
          </button>
          <button 
            onClick={handleCopy} 
            className="text-[10px] font-black bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1 rounded transition-all active:scale-95 border border-gray-700 uppercase"
          >
            COPY
          </button>
          <button 
            onClick={handleClear} 
            className="text-[10px] font-black bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1 rounded transition-all active:scale-95 border border-gray-700 uppercase"
          >
            CLEAR
          </button>
        </div>
      </div>
      
      {/* Notepad Style Input Row */}
      <div className="px-0 bg-black/40 border-t border-gray-800/30">
        <input
          ref={inputRef}
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full bg-transparent text-[#00ff41] font-mono text-sm px-4 py-2 focus:outline-none placeholder-gray-800 h-10 transition-colors selection:bg-green-500/30 overflow-x-auto whitespace-nowrap"
          spellCheck={false}
          autoComplete="off"
          placeholder="Paste your Gemini API Key here..."
        />
      </div>
    </div>
  );
};