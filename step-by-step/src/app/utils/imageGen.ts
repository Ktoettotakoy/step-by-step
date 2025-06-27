import { GoogleGenAI } from "@google/genai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.warn("API_KEY environment variable not set. API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export const generateImageForWord = async (word: string): Promise<string> => {
    if (!word) {
        throw new Error("Prompt word cannot be empty.");
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("API key is not configured. Please set the API_KEY environment variable.");
    }

    try {
        const augmentedPrompt = `A clear, high-quality, photorealistic image of a single "${word}" on a clean white background.`;

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: augmentedPrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];
            if (img.image.imageBytes) {
                const base64ImageBytes: string = img.image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
            throw new Error(`API returned an empty image for the word "${word}".`);
        } else {
            throw new Error(`Image generation failed for the word "${word}": No image data was returned from the API.`);
        }
    } catch (error) {
        console.error(`Error generating image for word "${word}":`, error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                 throw new Error("The provided API key is not valid. Please check your configuration.");
            }
            throw new Error(`An API error occurred for the word "${word}": ${error.message}`);
        }
        throw new Error(`An unknown error occurred during image generation for the word "${word}".`);
    }
};
