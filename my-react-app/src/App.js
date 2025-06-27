
import './App.css';
import React, { useState } from 'react';
import { getVoiceMessage } from '/home/user/step-by-step/my-react-app/src/GeminiVoice/geminiVoice';
import VoicePlayer from '/home/user/step-by-step/my-react-app/src/GeminiVoice/VoicePlayer';

import './ui/global.css';
import TestUi from './ui/testUi';

function App() {
  const [audioData, setAudioData] = useState(null);
  return (
    <div className="App">
      <header className="App-header">
        
      <TestUi />

        // don't delete
        <button onClick={async () => {
          const inputText = "Hello, world!";
          const audioBytes = await getVoiceMessage(inputText);
          const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioData(audioUrl);
        }}>Get Voice Message</button>
        <button onClick={() => {
          if (audioData) {
            const audio = new Audio(audioData);
            audio.play();
          }
        }} disabled={!audioData}>Play Voice</button>
        <VoicePlayer />
      </header>
    </div>
  );
}

export default App;


