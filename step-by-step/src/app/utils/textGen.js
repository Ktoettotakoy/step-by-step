  import { GoogleGenAI } from "@google/genai";

  const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

  function shuffleArray(array) {
    // 1. Create a copy of the array to avoid modifying the original.
    const shuffled = [...array]; 
    
    // 2. Loop backwards through the array.
    for (let i = shuffled.length - 1; i > 0; i--) {
      // 3. Pick a random index from 0 to i (inclusive).
      const j = Math.floor(Math.random() * (i + 1));
      
      // 4. Swap the elements at positions i and j.
      // This uses modern ES6 destructuring assignment for a clean swap.
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  // returns a list of 10 words
  async function generateGuessingWords() {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `we are doing the app that generates images for kids and they need to guess what is on the image.
        create the 10 words of what can kid guess (3-4 year old) of this list:
        1. any animal
        as output just give the 10 words separeted by space`,
    });
    return shuffleArray(response.text.split(' '));
  }
  
  // 2. the number up to 10
  // 3. the letter of the alphabet.

export { generateGuessingWords }
