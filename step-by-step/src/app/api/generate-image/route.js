// File: /src/app/api/generate-image/route.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Ensure your API key is loaded from environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable not set. Please set it in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
        }

        // Use the correct Imagen 3 model
        const model = genAI.getGenerativeModel({
            model: "imagen-3.0-generate-002"
        });

        // Generate a single image
        const result = await model.generateContent({
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        const response = await result.response;
        const candidates = response.candidates;

        // Extract the first image from the response
        let imageData = null;

        if (candidates && candidates.length > 0) {
            const candidate = candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }
        }

        if (!imageData) {
            return NextResponse.json({
                error: 'No image was generated in the response.'
            }, { status: 500 });
        }

        return NextResponse.json({
            image: imageData,
            success: true
        }, { status: 200 });

    } catch (error) {
        console.error('Error generating image:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to generate image.';
        if (error.message.includes('not found')) {
            errorMessage = 'Image generation model not available. Please check your API access.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please check your usage limits.';
        } else if (error.message.includes('authentication')) {
            errorMessage = 'Authentication failed. Please check your API key.';
        }

        return NextResponse.json({
            error: errorMessage,
            details: error.message
        }, { status: 500 });
    }
}
