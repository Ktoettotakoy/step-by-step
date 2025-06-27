'use client'; // This must be a client component for interaction and hooks

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './game.module.css';
// Make sure these imports are correct based on your file structure
import { getVoiceMessage, playVoiceFromText, transcribeAudioWithGemini, containsWordCaseInsensitive } from '../utils/voice';


const MAX_CARDS_PER_ROUND = 5; // Reduced for easier testing, set to 10 for your requirement

export default function GameScreen() {
    const [currentCard, setCurrentCard] = useState(null);
    const [score, setScore] = useState(0);
    const [cardCount, setCardCount] = useState(0);
    const [wrongCards, setWrongCards] = useState([]);
    const [gamePhase, setGamePhase] = useState('loading'); // 'loading', 'displayingCard', 'listening', 'feedback', 'results', 'wrongAnswers'
    const [isListening, setIsListening] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [lastVoiceInput, setLastVoiceInput] = useState(''); // To display what was heard

    // MediaRecorder specific state and refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null); // To hold the MediaStream object


    // Function to load the next card
    const loadNextCard = useCallback(() => {
        if (cardCount >= MAX_CARDS_PER_ROUND) {
            setGamePhase('results');
            return;
        }
        setCardCount(prev => prev + 1);
        setCurrentCard(generateCardData()); // Using the simple mock for now
        setFeedbackMessage('');
        setLastVoiceInput('');
        setGamePhase('displayingCard');
    }, [cardCount]);

    // Initial load and subsequent card loads
    useEffect(() => {
        if (gamePhase === 'loading') {
            loadNextCard();
        }
    }, [gamePhase, loadNextCard]);

    // Play card word audio when a new card is displayed
    useEffect(() => {
        if (gamePhase === 'displayingCard' && currentCard) {
            // Add a small delay before playing to ensure the component is rendered
            const playTimeout = setTimeout(() => {
                playVoiceFromText(currentCard.word);
            }, 500); // Adjust delay as needed

            return () => clearTimeout(playTimeout); // Cleanup timeout
        }
    }, [gamePhase, currentCard]);

    // Cleanup function for media stream
    useEffect(() => {
        return () => {
            // Stop all tracks on the stream when the component unmounts
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
            }
        };
    }, []); // Run once on mount and cleanup on unmount


    const startRecording = async () => {
        setIsListening(true);
        setFeedbackMessage('Listening...');
        setGamePhase('listening'); // Indicate that we are listening

        try {
            // Request microphone access
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                // Ensure mediaRecorder is defined before proceeding
                if (!mediaRecorderRef.current) return;

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log("Audio Blob created:", audioBlob);

                setIsListening(false);
                setFeedbackMessage('Transcribing...');
                setGamePhase('feedback'); // Move to feedback phase early

                let recognizedText = '';
                try {
                    recognizedText = await transcribeAudioWithGemini(audioBlob);
                    recognizedText = recognizedText ? recognizedText.trim() : ''; // Clean up text
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
                    // Stop all tracks on the stream to release microphone
                    if (audioStreamRef.current) {
                        audioStreamRef.current.getTracks().forEach(track => track.stop());
                        audioStreamRef.current = null;
                    }
                    // After showing feedback for a brief moment, move to next card or results
                    setTimeout(() => {
                        loadNextCard();
                    }, 2000); // Show feedback for 2 seconds
                }
            };

            mediaRecorderRef.current.start();
        } catch (error) {
            console.error("Microphone access or recording error:", error);
            setFeedbackMessage('Microphone access denied or error starting recording. Please allow microphone access.');
            setIsListening(false);
            setGamePhase('feedback');
            // Give user time to read error, then allow them to try again
            setTimeout(() => {
                loadNextCard(); // Or set phase back to 'displayingCard' if you want them to re-attempt the same card
            }, 3000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false); // Will be set to true again by onstop, but good to reset
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
        setCardCount(0);
        setWrongCards([]);
        setGamePhase('loading'); // This will trigger loadNextCard
    };

    const handleShowWrongAnswers = () => {
        setGamePhase('wrongAnswers');
    };

    if (gamePhase === 'loading') {
        return <div className={styles.gameContainer}>Loading game...</div>;
    }

    return (
        <div className={`${styles.page} ${styles.gamePage}`}>
            <header className={styles.gameHeader}>
                <p>Score: {score} / {cardCount - 1}</p>
                <p>Card: {cardCount} / {MAX_CARDS_PER_ROUND}</p>
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

// Mock function for card data (from your original code)
const generateCardData = () => {
    const cards = [
        { id: 1, imageSrc: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Apple', word: 'apple', metadata: 'apple' },
        { id: 2, imageSrc: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Banana', word: 'banana', metadata: 'banana' },
        { id: 3, imageSrc: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Cat', word: 'cat', metadata: 'cat' },
        { id: 4, imageSrc: 'https://via.placeholder.com/150/FFFF00/000000?text=Dog', word: 'dog', metadata: 'dog' },
        { id: 5, imageSrc: 'https://via.placeholder.com/150/00FFFF/000000?text=House', word: 'house', metadata: 'house' },
        { id: 6, imageSrc: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Tree', word: 'tree', metadata: 'tree' },
        { id: 7, imageSrc: 'https://via.placeholder.com/150/A0A0A0/FFFFFF?text=Car', word: 'car', metadata: 'car' },
        { id: 8, imageSrc: 'https://via.placeholder.com/150/C0C0C0/000000?text=Book', word: 'book', metadata: 'book' },
        { id: 9, imageSrc: 'https://via.placeholder.com/150/D0D0D0/000000?text=Sun', word: 'sun', metadata: 'sun' },
        { id: 10, imageSrc: 'https://via.placeholder.com/150/E0E0E0/000000?text=Moon', word: 'moon', metadata: 'moon' },
        { id: 11, imageSrc: 'https://via.placeholder.com/150/F0F0F0/000000?text=Bird', word: 'bird', metadata: 'bird' },
    ];
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
};
