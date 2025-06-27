// 1. Data Structure for Pictures and Words (Concepts)
const concepts = [
    { word: 'cat', description: 'a fluffy cat' },
    { word: 'dog', description: 'a playful dog' },
    { word: 'apple', description: 'a red apple' },
    { word: 'ball', description: 'a colorful ball' },
  ];
  
  // 2. Game State Management
  let gameState = {
    currentPictureIndex: 0,
    score: 0,
    isGameOver: false,
    feedbackMessage: '',
  };
  
  // Function to get the current concept
  function getCurrentConcept() {
    if (gameState.currentPictureIndex < concepts.length) {
      return concepts[gameState.currentPictureIndex];
    }
    return null; // No more concepts
  }
  
  // Function to handle user input and update game state
  function handleUserInput(userInput) {
    if (gameState.isGameOver) {
      return; // Do nothing if game is over
    }
  
    const currentConcept = getCurrentConcept();
    if (!currentConcept) {
      return; // Should not happen if isGameOver is false, but good practice
    }
  
    // --- AI Input Checking Placeholder ---
    // In a real app, you would send userInput and currentConcept.word to your AI model here.
    // The AI would return a boolean indicating if the input is correct.
    const isCorrect = userInput.toLowerCase() === currentConcept.word.toLowerCase(); // Simple string match for now
  
    if (isCorrect) {
      gameState.score++;
      gameState.feedbackMessage = 'Correct!';
  
      if (gameState.currentPictureIndex < concepts.length - 1) {
        gameState.currentPictureIndex++;
      } else {
        gameState.isGameOver = true;
        gameState.feedbackMessage = 'Game Over! Your score: ' + gameState.score;
      }
    } else {
      gameState.feedbackMessage = 'Try again.';
    }
  
    // --- UI Update Placeholder ---
    // In your actual application, you would update the UI here
    // to display the new picture (if correct), feedback message, and score.
    console.log("Game State Updated:", gameState);
    console.log("Current Concept:", getCurrentConcept());
  }
  
  // Function to start a new game
  function startNewGame() {
    gameState = {
      currentPictureIndex: 0,
      score: 0,
      isGameOver: false,
      feedbackMessage: '',
    };
    console.log("New game started. Game State:", gameState);
    console.log("Current Concept:", getCurrentConcept());
  }
  
  // To use these functions in other files (e.g., your React components),
  // you'll need to export them.
  export { concepts, gameState, getCurrentConcept, handleUserInput, startNewGame };
  