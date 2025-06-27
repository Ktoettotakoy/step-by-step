import './testUi.css';
import React, { useState } from 'react';
// import { getVoiceMessage } from '/home/user/step-by-step/my-react-app/src/GeminiVoice/geminiVoice';
// import VoicePlayer from '/home/user/step-by-step/my-react-app/src/GeminiVoice/VoicePlayer';

import './ui/global.css'; // Global CSS for theme variables etc.
import TestUi from './ui/testUi'; // Import your main screen component
import HeroSection from './HeroSection'; // Import your Hero Section (if you want to show it later)
import styles from './App.module.css'; // Import App.module.css for general styles

// Placeholder components if you're not importing them from specific files
// If you're only showing TestUi initially, you might not need these here yet.
// However, if HeroSection is shown after TestUi, HeroSection will need them.


const TextPressure = ({ text, flex, alpha, stroke, width, weight, italic, textColor, strokeColor, minFontSize }) => (
  <div style={{ color: textColor, WebkitTextStroke: stroke ? `1px ${strokeColor}` : 'none', fontSize: minFontSize }}>
    {text}
  </div>
);


function App() {
  const [showPortfolio, setShowPortfolio] = useState(false); // State to control what's displayed

  // This function would be passed to TestUi if it's responsible for changing the view
  const handleStartGame = () => {
    setShowPortfolio(true);
  };
  };


  return (
    <div className="App">
      <header className="App-header">
        {/* Conditional rendering based on showPortfolio state */}
        {!showPortfolio ? (
          // If showPortfolio is false, show the TestUi (main screen)
          <TestUi onStart={handleStartGame} /> // Pass a prop to TestUi to handle the start button click
        ) : (
          // If showPortfolio is true, show the portfolio content
          <div className={styles.page}>
            {/* <HeroSection /> */}
            {/* You would render other sections like Skills, Projects, Contact here */}
            {/* <section id="skills" className={`${styles.section} ${styles.skillsSection}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Skills</h2>
              </div>
              <div className={styles.skillGrid}>
                <p>React, JavaScript, HTML, CSS, Node.js, Python, etc.</p>
              </div>
            </section> */}

            {/* <section id="projects" className={`${styles.section} ${styles.projectsSection}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Projects</h2>
              </div>
              <div className={styles.projectsContainer}>
                <p>Project 1, Project 2, Project 3...</p>
              </div>
            </section> */}

            {/* <section id="contact" className={`${styles.section} ${styles.contactSection}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact</h2>
              </div>
              <div className={styles.contactContainer}>
                ... contact info and form ...
              </div>
            </section> */}

            {/* <footer className={styles.footer}>
              ... footer content ...
            </footer> */}

            {/* Voice message buttons (optional) */}
            {/* <button onClick={async () => {
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
            <VoicePlayer /> */}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
