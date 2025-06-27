import React, { useState } from 'react';
import { playVoiceFromText } from './GeminiVoice/geminiVoice'; // Adjust the import path as needed

const VoicePlayer = () => {
  const [inputText, setInputText] = useState('');

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handlePlayVoice = () => {
    if (inputText.trim() !== '') {
      playVoiceFromText(inputText);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter text to speak"
      />
      <button onClick={handlePlayVoice}>
        Play Voice
      </button>
    </div>
  );
};

export default VoicePlayer;