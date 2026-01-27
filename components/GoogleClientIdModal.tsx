import React, { useState } from 'react';

interface GoogleClientIdModalProps {
  onSave: (clientId: string) => void;
  onCancel: () => void;
}

export const GoogleClientIdModal: React.FC<GoogleClientIdModalProps> = ({ onSave, onCancel }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSave(input.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg text-white border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-red-500">Google Drive Integration Setup</h2>
        
        {/* Alternative Solution Section */}
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-green-400 mb-2">💡 Easier Alternative (Recommended)</h3>
          <p className="text-sm text-gray-300 mb-2">
            If you are on <strong>Mobile (Android/iOS)</strong> or have <strong>Google Drive for Desktop</strong>:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1 ml-1">
            <li>Click <strong>Cancel</strong> below.</li>
            <li>Select <strong>"From Device"</strong> instead.</li>
            <li>On <strong>Mobile</strong>: Select 'Drive' from the file picker menu.</li>
            <li>On <strong>Computer</strong>: Browse to your Drive folder (e.g., G: drive).</li>
          </ol>
          <p className="text-xs text-gray-400 mt-2 italic">
            This works instantly without any setup!
          </p>
        </div>

        <div className="border-t border-gray-700 my-4"></div>

        <h3 className="font-bold text-gray-200 mb-2">Advanced: Connect via API</h3>
        <p className="text-gray-400 mb-4 text-xs leading-relaxed">
          To use the native Google Drive Picker popup inside this web app, Google requires a security key called a <strong>Client ID</strong>.
        </p>

        <details className="mb-4 bg-gray-900/50 p-3 rounded border border-gray-700 group">
            <summary className="text-sm cursor-pointer font-medium text-blue-400 hover:text-blue-300 select-none">
                How to get a Client ID (Click to expand)
            </summary>
            <ol className="list-decimal list-inside text-xs text-gray-400 mt-3 space-y-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>.</li>
                <li>Create a new project (e.g., "My AI App").</li>
                <li>Search for and enable <strong>"Google Drive API"</strong>.</li>
                <li>Go to <strong>Credentials</strong> → Create Credentials → <strong>OAuth Client ID</strong>.</li>
                <li>If prompted, configure the "Consent Screen" (select "External", fill in required email fields).</li>
                <li>Application Type: <strong>Web application</strong>.</li>
                <li>Authorized JavaScript origins: Add <code>{window.location.origin}</code></li>
                <li>Click Create and copy the <strong>Client ID</strong>.</li>
            </ol>
        </details>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">
              Paste Client ID here
            </label>
            <input
              type="text"
              id="clientId"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., 123456789-abcde.apps.googleusercontent.com"
              className="w-full p-2 bg-gray-900 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};