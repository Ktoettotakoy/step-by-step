// File: /src/app/api/generate-image/route.js

import { GoogleGenAI } from '@google/genai'; // Assuming this is your AI SDK import
import { NextResponse } from 'next/server';

// Initialize your AI model with the API key from environment variables
// Ensure NEXT_PUBLIC_GEMINI_API_KEY is set in your .env.local file
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            // Return a 400 Bad Request if the prompt is missing
            return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
        }

        // Call the AI model to generate images
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002', // Ensure this model is correct and accessible
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        console.log('Response from AI:', response);

    } catch (error) {
        console.error('Error generating image:', error);
        // Return a 500 Internal Server Error if something goes wrong
        return NextResponse.json({ error: 'Failed to generate image.' }, { status: 500 });
    }
}
