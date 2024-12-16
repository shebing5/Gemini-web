import { useState } from 'react';
import { useApiKeyStore } from '../store/apiKeyStore';
import { Settings, Eye, EyeOff } from 'lucide-react';

export function ApiKeyManager() {
  const { geminiKey, xaiKey, setGeminiKey, setXaiKey } = useApiKeyStore();
  const [showKeys, setShowKeys] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleVisibility = () => setShowKeys(!showKeys);
  const toggleOpen = () => setIsOpen(!isOpen);

  const maskKey = (key: string) => {
    if (!key) return '';
    return showKeys ? key : `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="API Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">API Settings</h3>
            <button
              onClick={toggleVisibility}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {showKeys ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemini API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter Gemini API key"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {geminiKey && (
                <p className="mt-1 text-sm text-gray-500">
                  Current key: {maskKey(geminiKey)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                XAI API Key
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={xaiKey}
                onChange={(e) => setXaiKey(e.target.value)}
                placeholder="Enter XAI API key"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {xaiKey && (
                <p className="mt-1 text-sm text-gray-500">
                  Current key: {maskKey(xaiKey)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Your API keys are stored securely in your browser's local storage.
          </div>
        </div>
      )}
    </div>
  );
}
