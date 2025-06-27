import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Or use fetch

function Game() {
  const [word, setWord] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // **WARNING: Do not expose your API keys like this in a production app!**
  const GEMINI_API_KEY = 'AIzaSyCRvrGDK4nTbXu5yWVGx8AO1t1b6o9zOFk';
  const IMAGE_GENERATION_API_KEY = 'AIzaSyCRvrGDK4nTbXu5yWVGx8AO1t1b6o9zOFk';

  const generateContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Generate Word using Gemini API
      const wordPrompt = "Give me a fun, simple word suitable for kids aged 5-8. Return just the word.";
      const geminiResponse = await axios.post(
        `AIzaSyCRvrGDK4nTbXu5yWVGx8AO1t1b6o9zOFk`, // Replace with the actual Gemini API endpoint for text generation
        {
          contents: [{ parts: [{ text: wordPrompt }] }],
          // Add any other necessary parameters for the Gemini API
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY, // Pass API key in headers
          },
        }
      );

      const generatedWord = geminiResponse.data.candidates[0].content.parts[0].text.trim();
      setWord(generatedWord);

      // 2. Generate Image using Image Generation API
      const imagePrompt = `Create a simple cartoon-style image of a ${generatedWord} suitable for children.`;

      const imageResponse = await axios.post(
        `AIzaSyCRvrGDK4nTbXu5yWVGx8AO1t1b6o9zOFk`, // Replace with the actual Image Generation API endpoint
        {
          prompt: imagePrompt,
          size: '512x512', // Or whatever size you need
          // Add any other necessary parameters for the Image Generation API
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${IMAGE_GENERATION_API_KEY}`, // Or whatever auth method the API uses
          },
        }
      );

      const generatedImageUrl = imageResponse.data.url; // Get the image URL from the API response
      setImageUrl(generatedImageUrl);

    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // You might want to call generateContent when the component mounts or a button is clicked
  // useEffect(() => {
  //   generateContent();
  // }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <h1>My AI Game</h1>
      <button onClick={generateContent} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Word and Image'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {word && <p>Word: {word}</p>}
      {imageUrl && <img src={imageUrl} alt={word} />}

      {/* Add other game elements here */}
    </div>
  );
}

export default Game;
