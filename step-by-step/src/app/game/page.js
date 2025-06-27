'use client'; // This must be a client component for interaction and hooks

import React, { useState, useEffect, useCallback } from 'react';
import styles from './game.module.css';
import { getVoiceMessage, playVoiceFromText } from '../utils/voice';

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

    // Function to load the next card
    const loadNextCard = useCallback(() => {
        if (cardCount >= MAX_CARDS_PER_ROUND) {
            setGamePhase('results');
            return;
        }
        setCardCount(prev => prev + 1);
        setCurrentCard(generateCardData());
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
            playVoiceFromText(currentCard.word);
        }
    }, [gamePhase, currentCard]);


    const handleListenClick = async () => {
        setIsListening(true);
        setFeedbackMessage('Listening...');
        try {
            const recognizedText = await listenToVoiceInput();
            setLastVoiceInput(recognizedText);
            setIsListening(false);
            setGamePhase('feedback'); // Move to feedback phase

            if (currentCard && validateVoiceInput(recognizedText, currentCard.metadata)) {
                setScore(prev => prev + 1);
                setFeedbackMessage('Correct!');
                await playVoiceFromText('Correct!'); // Provide audio feedback
            } else {
                setFeedbackMessage(`Incorrect. You said: "${recognizedText}". The correct word was: "${currentCard.word}".`);
                await playVoiceFromText('Try again!'); // Provide audio feedback
                if (currentCard) {
                    setWrongCards(prev => [...prev, { ...currentCard, userAttempt: recognizedText }]);
                }
            }
        } catch (error) {
            console.error("Speech recognition error:", error);
            setFeedbackMessage('Could not hear you. Please try again.');
            setIsListening(false);
            setGamePhase('feedback');
        } finally {
            // After showing feedback for a brief moment, move to next card or results
            setTimeout(() => {
                loadNextCard(); // Move to next card or results screen
            }, 2000); // Show feedback for 2 seconds
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
        <div className={`${styles.page} ${styles.gamePage}`}> {/* Added a gamePage class for specific styling */}
            <header className={styles.gameHeader}>
                <p>Score: {score} / {cardCount - 1}</p> {/* cardCount-1 because it increments *before* displaying */}
                <p>Card: {cardCount} / {MAX_CARDS_PER_ROUND}</p>
            </header>

            <main className={styles.gameMain}>
                {gamePhase === 'displayingCard' && currentCard && (
                    <div className={styles.cardContainer}>
                        <img src={currentCard.imageSrc} alt={currentCard.word} className={styles.cardImage} />
                        <p className={styles.cardWord}>{currentCard.word}</p> {/* Display the word for context/debug */}
                        <button
                            onClick={handleListenClick}
                            disabled={isListening}
                            className={`${styles.button} ${styles.listenButton}`}
                        >
                                {isListening ? 'Listening...' : 'Say it!'}
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
        { id: 11, imageSrc: 'https://via.placeholder.com/150/F0F0F0/000000?text=Bird', word: 'bird', metadata: 'bird' }, // More for repetition
    ];
    // Simple way to get a random card and ensure variety
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
};

// Mock function for voice input (replace with actual SpeechRecognition API)
const listenToVoiceInput = async () => {
    // In a real browser environment, you'd use the Web Speech API:
    // const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // const recognition = new SpeechRecognition();
    // recognition.interimResults = false;
    // recognition.lang = 'en-US';
    // return new Promise((resolve, reject) => {
    //     recognition.onresult = (event) => {
    //         const transcript = event.results[0][0].transcript;
    //         resolve(transcript.toLowerCase()); // Resolve with recognized text
    //     };
    //     recognition.onerror = (event) => reject(event.error);
    //     recognition.start();
    // });

    // For now, a simple mock that simulates recognition after a delay
    console.log("Mocking voice input...");
    return new Promise(resolve => {
        setTimeout(() => {
            const mockWords = ['apple', 'banana', 'cat', 'dog', 'house', 'tree', 'car', 'book', 'sun', 'moon', 'bird', 'aple', 'banan']; // Include some common misspellings
            const randomMockWord = mockWords[Math.floor(Math.random() * mockWords.length)];
            resolve(randomMockWord); // Simulate recognized text
        }, 2000); // Simulate 2 second listening
    });
};

// Function to validate voice input against metadata
const validateVoiceInput = (recognizedText, cardMetadata) => {
    // Basic validation: convert both to lowercase and trim whitespace
    return recognizedText.trim().toLowerCase() === cardMetadata.trim().toLowerCase();
};

// Your existing functions for voice output (assuming they are fixed and working)
// Make sure these are in a utility file and imported, or defined here for this example.
// For example: import { playVoiceFromText } from '../lib/audioUtils';

// Mock playVoiceFromText if your actual one isn't imported/fixed yet
// const playVoiceFromText = async (text) => {
//     console.log(`Playing voice for: "${text}"`);
//     // In a real scenario, this would use your Gemini API integration
//     // const audioBytes = await getVoiceMessage(text);
//     // if (audioBytes) {
//     //     const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
//     //     const audioUrl = URL.createObjectURL(audioBlob);
//     //     const audio = new Audio(audioUrl);
//     //     audio.play();
//     //     audio.onended = () => URL.revokeObjectURL(audioUrl);
//     //     audio.onerror = () => URL.revokeObjectURL(audioUrl);
//     // }
// };
// --- End of assumed functions ---
