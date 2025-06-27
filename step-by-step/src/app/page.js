'use client';

import React from 'react'; // No need for useState, useEffect
import TextPressure from './ui/blocks/TextAnimations/TextPressure/TextPressure';
import Dock from './ui/blocks/Components/Dock/Dock';
import styles from "./ui/page.module.css";
import { useRouter } from 'next/navigation';

// No longer importing generateGuessingWords or generateImageForWord here
// import { generateGuessingWords } from './utils/textGen';
// import { generateImageForWord } from './utils/imageGen';

export default function Home() {
  const router = useRouter();

  // No states for game data generation needed here anymore
  // const [gameCards, setGameCards] = useState([]);
  // const [isLoadingGameData, setIsLoadingGameData] = useState(true);
  // const [error, setError] = useState(null);

  // Removed useEffect for data fetching

  const handleStartGame = () => {
    // Simply navigate to the game page
    router.push('/game');
  };

  const handleYouTubeUrlInput = () => {
    // This will open a small pop-up asking for user input
    const youtubeUrl = window.prompt("Please enter a YouTube video URL:");

    // At this point, the 'youtubeUrl' variable will contain the user's input
    // or null if they pressed cancel.
    // The requirement is to 'do nothing' with it, so we'll just log it for demonstration.
    if (youtubeUrl !== null) {
      console.log("YouTube URL entered (doing nothing with it for now):", youtubeUrl);
      // You could add a small alert here for user feedback if desired, e.g.,
      // alert("Thanks! We've received your URL (but are not using it yet).");
      router.push('/sampled');
    } else {
      console.log("User cancelled YouTube URL input.");
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section id="hero" className={`${styles.section} ${styles.hero}`}>
        <Dock collapsible={false} position="top" responsive="bottom"/>
        <main className={styles.main}>
          <p>See Say Learn</p>
          <div>
            <TextPressure
              text="Step by Step"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="var(--text)"
              strokeColor="#ff0000"
              minFontSize={128}
            />
          </div>
          <p>Let children play useful games</p>
          <div className={styles.actionButtonContainer}>
            <button
              className={`${styles.button} ${styles.projectsButton}`}
              onClick={handleStartGame} // Simplified onClick handler
              // No longer disabled based on game data loading on this page
              // disabled={isLoadingGameData || error}
            >
              Start
            </button>
            <button
              className={`${styles.button} ${styles.projectsButton}`} // You might want a different style for this button
              onClick={handleYouTubeUrlInput}
            >
              Enter YouTube URL
            </button>
          </div>
          {/* No error message display here anymore */}
          {/* {error && <p className={styles.errorMessage}>{error}</p>} */}
        </main>
      </section>
    </div>
  );
}
