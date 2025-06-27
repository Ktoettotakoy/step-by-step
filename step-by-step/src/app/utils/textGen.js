  import { GoogleGenAI } from "@google/genai";

  const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

  // returns a list of 10 words
  async function generateGuessingWords() {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `we are doing the app that generates images for kids and they need to guess what is on the image.
        create the 10 words of what can kid guess (3-4 year old) of this list:
        1. any animal
        as output just give the 10 words separeted by space`,
    });
    return response.text.split(' ');
  }

    //2. the number up to 10
  // 3. the letter of the alphabet.

export { generateGuessingWords }
