'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './game.module.css'; // Adjust path as needed

// Make sure these imports are correct based on your file structure
import { transcribeAudioWithGemini, containsWordCaseInsensitive } from '../utils/voice';
import { generateGuessingWords } from '../utils/textGen'; // Import word generation
import { generateImageForWord } from '../utils/imageGen'; // Import image generation
import LoadingSpinner from '../ui/components/LoadingSpinner'; // Import the new spinner component


const MAX_CARDS_PER_ROUND = 4;

function playCorrectSound() {
    // The path '/correct.mp3' works because the file is in the /public directory.


    const audio = new Audio('correct.mp3');

    // .play() returns a Promise, so we should handle potential errors.
    audio.play().catch(error => {
      // Autoplay was prevented or another error occurred.
      console.error("Error playing audio:", error);
    });
  }

  function playWrongSound() {
    // The path '/correct.mp3' works because the file is in the /public directory.


    const audio = new Audio('wrong.mp3');

    // .play() returns a Promise, so we should handle potential errors.
    audio.play().catch(error => {
      // Autoplay was prevented or another error occurred.
      console.error("Error playing audio:", error);
    });
  }


export default function GameScreen() {
    // This will now store the full card objects (word + imageSrc)
    const [gameCards, setGameCards] = useState([]);
    const [isLoadingGameData, setIsLoadingGameData] = useState(true);
    // isGeneratingImage is largely redundant now as all images are part of initial load
    // const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const [currentCard, setCurrentCard] = useState(null);
    const [score, setScore] = useState(0);
    const [cardIndex, setCardIndex] = useState(0); // Use index to track progress through gameCards
    const [wrongCards, setWrongCards] = useState([]);
    const [gamePhase, setGamePhase] = useState('loading'); // 'loading' (initial data/image), 'displayingCard', 'listening', 'feedback', 'results', 'wrongAnswers'
    const [isListening, setIsListening] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [lastVoiceInput, setLastVoiceInput] = useState('');

    // MediaRecorder specific state and refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);

    // --- EFFECT TO GENERATE ALL GAME CARDS (WORDS + IMAGES) ON MOUNT ---
    useEffect(() => {
        const fetchAndGenerateAllCards = async () => {
            try {
                setIsLoadingGameData(true);
                setGamePhase('loading'); // Explicitly set phase to loading

                // 1. Generate guessing words
                const words = await generateGuessingWords();
                console.log("Generated words:", words);

                if (!words || words.length === 0) {
                    throw new Error("No words generated for the game.");
                }

                // Limit words to MAX_CARDS_PER_ROUND
                const wordsForRound = words.slice(0, MAX_CARDS_PER_ROUND);

                // 2. Generate images for each word concurrently
                const generatedCardPromises = wordsForRound.map(async (word, index) => {
                    let imageSrc;
                    try {
                        imageSrc = await generateImageForWord(word);
                    } catch (imageError) {
                        console.error(`Error generating image for "${word}":`, imageError);
                        imageSrc = 'https://via.placeholder.com/150/CCCCCC/000000?text=Error'; // Fallback image
                    }
                    return {
                        id: `${word}-${index}`, // Unique ID
                        word: word,
                        imageSrc: imageSrc,
                        metadata: word, // You can put more metadata here if needed
                    };
                });

                const allGeneratedCards = await Promise.all(generatedCardPromises);
                setGameCards(allGeneratedCards);
                console.log("All generated game cards:", allGeneratedCards);

            } catch (err) {
                console.error("Error generating all game data:", err);
                setFeedbackMessage("Failed to load game data. Please refresh.");
                // Set gameCards to empty array to display 'No game words generated' message
                setGameCards([]);
            } finally {
                setIsLoadingGameData(false);
            }
        };

        fetchAndGenerateAllCards();
    }, []); // Runs only once on component mount

    // Function to load the next card - now it just picks from pre-generated cards
    const loadNextCard = useCallback(() => {
        if (gameCards.length === 0 || isLoadingGameData) {
            // This should ideally not happen if isLoadingGameData is false and gameCards is populated
            console.warn("Attempted to load card before game data is ready or available.");
            return;
        }

        if (cardIndex >= gameCards.length) { // Check against actual number of generated cards
            setGamePhase('results'); // No more cards, go to results
            return;
        }

        const nextCardData = gameCards[cardIndex]; // Get the pre-generated card
        setFeedbackMessage('');
        setLastVoiceInput('');
        setCurrentCard(nextCardData);
        setCardIndex(prev => prev + 1); // Move to the next card for the next round
        setGamePhase('displayingCard'); // Card is ready to be displayed
    }, [cardIndex, gameCards, isLoadingGameData]);

    // Initial card load and subsequent card loads
    useEffect(() => {
        // Trigger loading the first card once `gameCards` are available and loading is complete
        if (!isLoadingGameData && gameCards.length > 0 && gamePhase === 'loading' && !currentCard) {
            loadNextCard();
        }
    }, [isLoadingGameData, gameCards, gamePhase, currentCard, loadNextCard]);

    // Play card word audio when a new card is displayed
    // useEffect(() => {
    //     if (gamePhase === 'displayingCard' && currentCard) {
    //         const playTimeout = setTimeout(() => {
    //             playVoiceFromText(currentCard.word);
    //         }, 500);

    //         return () => clearTimeout(playTimeout);
    //     }
    // }, [gamePhase, currentCard]);

    // Cleanup function for media stream
    useEffect(() => {
        return () => {
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
            }
        };
    }, []);


    const startRecording = async () => {
        setIsListening(true);
        setFeedbackMessage('Listening...');
        setGamePhase('listening');

        try {
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                if (!mediaRecorderRef.current) return;

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log("Audio Blob created:", audioBlob);

                // console.log("Transcribed from blob: " + (await transcribeAudioFromBlob(audioBlob)))

                setIsListening(false);
                setFeedbackMessage('Transcribing...');
                setGamePhase('feedback');
                // playCorrectSound
                let recognizedText = '';
                try {
                    recognizedText = await transcribeAudioWithGemini(audioBlob);
                    recognizedText = recognizedText ? recognizedText.trim() : '';
                    setLastVoiceInput(recognizedText);

                    if (currentCard && containsWordCaseInsensitive(recognizedText, currentCard.word)) {
                        setScore(prev => prev + 1);
                        setFeedbackMessage('Correct!');
                        playCorrectSound();
                        //await playVoiceFromText('Correct!');
                    } else {
                        setFeedbackMessage(`Incorrect. You said: "${recognizedText}". The correct word was: "${currentCard.word}".`);
                        playWrongSound();
                        //await playVoiceFromText('Try again!');
                        if (currentCard) {
                            setWrongCards(prev => [...prev, { ...currentCard, userAttempt: recognizedText }]);
                        }
                    }
                } catch (transcribeError) {
                    console.error("Transcription error:", transcribeError);
                    setFeedbackMessage('Could not transcribe audio. Please try again.');
                    setLastVoiceInput('');
                } finally {
                    if (audioStreamRef.current) {
                        audioStreamRef.current.getTracks().forEach(track => track.stop());
                        audioStreamRef.current = null;
                    }
                    setTimeout(() => {
                        loadNextCard();
                    }, 2000);
                }
            };

            mediaRecorderRef.current.start();
        } catch (error) {
            console.error("Microphone access or recording error:", error);
            setFeedbackMessage('Microphone access denied or error starting recording. Please allow microphone access.');
            setIsListening(false);
            setGamePhase('feedback');
            setTimeout(() => {
                loadNextCard();
            }, 3000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const handleListenClick = () => {
        if (!isListening) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    const handleStartNewRound = () => {
        setScore(0);
        setCardIndex(0);
        setWrongCards([]);
        setGameCards([]); // Clear cards to force re-fetch and generate new ones
        setIsLoadingGameData(true); // Set to true to trigger the useEffect to fetch new cards
        setGamePhase('loading');
        setCurrentCard(null);
    };

    const handleShowWrongAnswers = () => {
        setGamePhase('wrongAnswers');
    };

    // --- Conditional Rendering for Loading ---
    if (isLoadingGameData) {
        return (
            <div className={`${styles.page} ${styles.gamePage}`}>
                <main className={styles.gameMain}>
                    <LoadingSpinner message="Generating game cards (words & images)..." />
                </main>
            </div>
        );
    }

    if (gameCards.length === 0 && !isLoadingGameData) { // Check !isLoadingGameData to ensure it's not just pending
        return (
            <div className={`${styles.page} ${styles.gamePage}`}>
                <main className={styles.gameMain}>
                    <p className={styles.feedbackMessage}>No game cards could be generated. Please try again.</p>
                    <button onClick={handleStartNewRound} className={`${styles.button} ${styles.resultsButton}`}>
                        Retry
                    </button>
                </main>
            </div>
        );
    }

    // After initial loading, if gamePhase is 'loading' it means we're preparing the next card
    // (but its image is already generated, just setting state).
    // This case might still be relevant for a very quick state transition,
    // or if you want a subtle spinner between cards.
    // If not, you can remove this specific `if` block, as `displayingCard` will immediately follow.
    if (gamePhase === 'loading' && !currentCard) {
        return (
            <div className={`${styles.page} ${styles.gamePage}`}>
                <main className={styles.gameMain}>
                    <LoadingSpinner message="Preparing next card..." />
                </main>
            </div>
        );
    }

    return (
        <div className={`${styles.page} ${styles.gamePage}`}>
            <header className={styles.gameHeader}>
                <p>Score: {score} / {cardIndex - 1}</p>
                <p>Card: {cardIndex} / {gameCards.length}</p> {/* Use gameCards.length for total */}
            </header>

            <main className={styles.gameMain}>
                {gamePhase === 'displayingCard' && currentCard && (
                    <div className={styles.cardContainer}>
                        <img src={currentCard.imageSrc} alt={currentCard.word} className={styles.cardImage} />
                        <p className={styles.cardWord}>{currentCard.word}</p>
                        <button
                            onClick={handleListenClick}
                            disabled={isListening}
                            className={`${styles.button} ${styles.listenButton}`}
                        >
                            {isListening ? 'Listening...' : 'Say it!'}
                        </button>
                    </div>
                )}

                {gamePhase === 'listening' && (

                    <div className={styles.cardContainer}>
                        <img src={currentCard.imageSrc} alt={currentCard.word} className={styles.cardImage} />
                        <p className={styles.cardWord}>{currentCard.word}</p>
                        <button
                            onClick={stopRecording}
                            className={`${styles.button} ${styles.listenButton}`}
                        >
                            Stop Listening
                        </button>
                    </div>
                )}

                {gamePhase === 'feedback' && (
                    <div className={styles.feedbackContainer}>
                        <p className={styles.feedbackMessage}>{feedbackMessage}</p>
                        {lastVoiceInput && <p className={styles.lastVoiceInput}>You said: "{lastVoiceInput}"</p>}
                    </div>
                )}

                {gamePhase === 'results' && (
                    <div className={styles.resultsContainer}>
                        <h2>Round Over!</h2>
                        <p>Your final score: {score} out of {gameCards.length}</p> {/* Use gameCards.length */}
                        {wrongCards.length > 0 && (
                            <button onClick={handleShowWrongAnswers} className={`${styles.button} ${styles.resultsButton}`}>
                                Review Mistakes ({wrongCards.length})
                            </button>
                        )}
                        <button onClick={handleStartNewRound} className={`${styles.button} ${styles.resultsButton}`}>
                                Play Another Round
                        </button>
                    </div>
                )}

                {gamePhase === 'wrongAnswers' && (
                    <div className={styles.wrongAnswersContainer}>
                        <h2>Your Mistakes:</h2>
                        {wrongCards.length > 0 ? (
                            <ul className={styles.wrongAnswersList}>
                                {wrongCards.map((card, index) => (
                                    <li key={card.id || index} className={styles.wrongAnswerItem}>
                                        <img src={card.imageSrc} alt={card.word} className={styles.wrongAnswerImage} />
                                        <p>Correct: "{card.word}"</p>
                                        <p>Your attempt: "{card.userAttempt}"</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No mistakes this round!</p>
                        )}
                        <button onClick={handleStartNewRound} className={`${styles.button} ${styles.resultsButton}`}>
                            Play Another Round
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
