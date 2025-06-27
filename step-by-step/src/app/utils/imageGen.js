// Import the Gemini API client library
  // Replace 'YOUR_GEMINI_API_KEY' with your actual API key for the demo
  // In a real application, this would be handled on the backend
  import { GoogleGenerativeAI } from "@google/generative-ai";
   // Replace with your API key
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  
  /**
   * Calls the Gemini API to generate a cartoon-style image based on a prompt.
   *
   * @returns {Promise<{image: string, word: string}|null>} A promise that resolves with an object
   *   containing the image data (e.g., base64 string) and the descriptive word,
   *   or null if there was an error.
   */
  async function generateImageWithGemini() {
    try {
      // Replace 'your-image-generation-model' with the actual Gemini model name for image generation
      const model = genAI.getGenerativeModel( { model: "gemini-2.5-flash" } );
  
      const prompt = `
        we are doing the app that generates images for kids.
        create the cartoon style image of
        1. any animal
        2. the number up to 10
        3. the letter of the alphabet.
  
        as output, give back the image and the single word that explain what's in the image
      `;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
  
      // Assuming the API response contains image data and a text part with the word
      // You'll need to adjust this based on the actual API response structure
      const image = response.image; // Adjust this to extract the image data correctly
      const word = response.text(); // Adjust this to extract the descriptive word correctly
  
      if (image && word) {
        return { image, word };
      } else {
        console.error("Gemini API response did not contain both image and word.");
        return null;
      }
  
    } catch (error) {
      console.error("Error generating image with Gemini:", error);
      return null;
    }
  }
  
  async function generateGuessingWords() {
    try {
  
      const prompt = `
        we are doing the app that generates images for kids and they need to guess what is on the image.
        create the 10 words of what can kid guess (3-4 year old) of this list:
        1. any animal
        2. the number up to 10
        3. the letter of the alphabet.
        as output just give the 10 words separeted by space
      `;
  
      const result = await genAI.generateContent(prompt);
      const response = await result.response;
      const wordsString = response.text();
      return wordsString.split(' ');
    } catch (error) {
      console.error("Error generating guessing words with Gemini:", error);
      return [];
    }
  }

  // Example usage:
  // async function displayGeneratedImage() {
  //   const result = await generateImageWithGemini();
  //   if (result) {
  //     console.log("Generated Word:", result.word);
  //     // Display the image (e.g., in an <img> tag)
  //     // const imgElement = document.createElement('img');
  //     // imgElement.src = result.image; // Assuming result.image is a data URL or URL
  //     // document.body.appendChild(imgElement);
  //   } else {
  //     console.log("Failed to generate image.");
  //   }
  // }
  
  // displayGeneratedImage();
  
  // You can export this function if needed in other files
export { generateImageWithGemini, generateGuessingWords };
