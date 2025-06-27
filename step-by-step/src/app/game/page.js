'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './game.module.css'; // Adjust path as needed

// Make sure these imports are correct based on your file structure
import { getVoiceMessage, playVoiceFromText, transcribeAudioWithGemini, containsWordCaseInsensitive } from '../utils/voice';
import { generateGuessingWords } from '../utils/textGen'; // Import word generation
import { generateImageForWord } from '../utils/imageGen'; // Import image generation
import LoadingSpinner from '../ui/components/LoadingSpinner'; // Import the new spinner component


const MAX_CARDS_PER_ROUND = 10;

export default function GameScreen() {
    const [gameWords, setGameWords] = useState([]);
    const [isLoadingGameData, setIsLoadingGameData] = useState(true);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const [currentCard, setCurrentCard] = useState(null);
    const [score, setScore] = useState(0);
    const [cardIndex, setCardIndex] = useState(0);
    const [wrongCards, setWrongCards] = useState([]);
    const [gamePhase, setGamePhase] = useState('loading');
    const [isListening, setIsListening] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [lastVoiceInput, setLastVoiceInput] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);

    // --- EFFECT TO GENERATE GAME WORDS ON MOUNT ---
    useEffect(() => {
        const fetchAndSetWords = async () => {
            try {
                setIsLoadingGameData(true);
                setGamePhase('loading'); // Explicitly set phase to loading for initial words
                const words = await generateGuessingWords();
                setGameWords(words);
            } catch (err) {
                console.error("Error generating game words:", err);
                setFeedbackMessage("Failed to load game words. Please refresh.");
                // Potentially set gamePhase to an error state to display a message
            } finally {
                setIsLoadingGameData(false);
            }
        };

        fetchAndSetWords();
    }, []);

    // Function to load the next card - now includes image generation
    const loadNextCard = useCallback(async () => {
        if (gameWords.length === 0 || isLoadingGameData) {
            return; // Wait for words to be loaded
        }

        if (cardIndex >= gameWords.length || cardIndex >= MAX_CARDS_PER_ROUND) {
            setGamePhase('results');
            return;
        }

        const nextWord = gameWords[cardIndex];
        setFeedbackMessage('');
        setLastVoiceInput('');
        setGamePhase('loading'); // Set to loading while fetching image

        setIsGeneratingImage(true);
        let imageUrl;
        try {
            imageUrl = await generateImageForWord(nextWord);
        } catch (error) {
            console.error('Error generating image for word:', nextWord, error);
            imageUrl = 'https://via.placeholder.com/150/CCCCCC/000000?text=Error';
        } finally {
            setIsGeneratingImage(false);
        }

        setCurrentCard({
            id: nextWord,
            imageSrc: imageUrl,
            word: nextWord,
            metadata: nextWord,
        });
        setCardIndex(prev => prev + 1);
        setGamePhase('displayingCard');
    }, [cardIndex, gameWords, isLoadingGameData]);

    // Initial card load and subsequent card loads
    useEffect(() => {
        // Trigger loading the first card once `gameWords` are available
        // and if we are in the 'loading' phase (e.g., after initial word fetch or new round)
        // and no image is currently being generated, and currentCard isn't set yet for this phase
        if (!isLoadingGameData && gameWords.length > 0 && gamePhase === 'loading' && !currentCard && !isGeneratingImage) {
            loadNextCard();
        }
    }, [isLoadingGameData, gameWords, gamePhase, currentCard, isGeneratingImage, loadNextCard]);

    // Play card word audio when a new card is displayed
    useEffect(() => {
        if (gamePhase === 'displayingCard' && currentCard && !isGeneratingImage) {
            const playTimeout = setTimeout(() => {
                playVoiceFromText(currentCard.word);
            }, 500);

            return () => clearTimeout(playTimeout);
        }
    }, [gamePhase, currentCard, isGeneratingImage]);

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

                setIsListening(false);
                setFeedbackMessage('Transcribing...');
                setGamePhase('feedback');

                let recognizedText = '';
                try {
                    recognizedText = await transcribeAudioWithGemini(audioBlob);
                    recognizedText = recognizedText ? recognizedText.trim() : '';
                    setLastVoiceInput(recognizedText);

                    if (currentCard && containsWordCaseInsensitive(recognizedText, currentCard.word)) {
                        setScore(prev => prev + 1);
                        setFeedbackMessage('Correct!');
                        await playVoiceFromText('Correct!');
                    } else {
                        setFeedbackMessage(`Incorrect. You said: "${recognizedText}". The correct word was: "${currentCard.word}".`);
                        await playVoiceFromText('Try again!');
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
        setGameWords([]); // Clear words to force re-fetch and generate new words
        setIsLoadingGameData(true); // Set to true to trigger the useEffect to fetch new words
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
                <main className={styles.gameMain}> {/* Use gameMain for centering */}
                    <LoadingSpinner message="Generating game words..." />
                </main>
            </div>
        );
    }

    if (gameWords.length === 0) {
        return (
            <div className={`${styles.page} ${styles.gamePage}`}>
                <main className={styles.gameMain}>
                    <p className={styles.feedbackMessage}>No game words generated. Please try again.</p>
                    <button onClick={handleStartNewRound} className={`${styles.button} ${styles.resultsButton}`}>
                        Retry
                    </button>
                </main>
            </div>
        );
    }

    // This phase occurs while an individual card's image is being generated or prepared
    if (gamePhase === 'loading' || (gamePhase === 'displayingCard' && !currentCard)) {
        return (
            <div className={`${styles.page} ${styles.gamePage}`}>
                <main className={styles.gameMain}>
                    <LoadingSpinner message={isGeneratingImage ? "Generating card image..." : "Preparing card..."} />
                </main>
            </div>
        );
    }

    return (
        <div className={`${styles.page} ${styles.gamePage}`}>
            <header className={styles.gameHeader}>
                <p>Score: {score} / {cardIndex - 1}</p>
                <p>Card: {cardIndex} / {MAX_CARDS_PER_ROUND}</p>
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
                    <div className={styles.feedbackContainer}>
                        <p className={styles.feedbackMessage}>Listening for your response...</p>
                        <button onClick={stopRecording} className={`${styles.button} ${styles.stopListenButton}`}>
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
                        <p>Your final score: {score} out of {MAX_CARDS_PER_ROUND}</p>
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
