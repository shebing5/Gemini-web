import React from 'react';
import { MODELS } from '../config/api';

interface ModelSelectorProps {
  currentModel?: string;
  onChange?: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onChange }) => {
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    onChange?.(newModel);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-selector" className="text-sm font-medium text-gray-700">
        Model:
      </label>
      <select
        id="model-selector"
        value={currentModel || Object.values(MODELS.GEMINI)[0]}
        onChange={handleModelChange}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {Object.entries(MODELS).map(([provider, models]) => (
          <optgroup key={provider} label={provider}>
            {Object.entries(models).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};
