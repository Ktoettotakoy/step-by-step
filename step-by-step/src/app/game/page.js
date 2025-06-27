'use client'; // This must be a client component for interaction and hooks

import React, { useState, useEffect, useCallback } from 'react';
import styles from './game.module.css';

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
