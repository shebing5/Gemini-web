import React, { useEffect, useRef } from 'react';

const REACTIONS = ['👍', '👎', '❤️', '😄', '😢', '🎉', '🤔', '👀'];

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  const reactions = ['👍', '❤️', '😄', '🎉', '🤔', '👀', '🚀', '👏'];
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-2 border flex flex-wrap gap-1 max-w-[200px] w-max">
      {reactions.map((reaction) => (
        <button
          key={reaction}
          onClick={() => onSelect(reaction)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <span className="text-lg">{reaction}</span>
        </button>
      ))}
    </div>
  );
};
