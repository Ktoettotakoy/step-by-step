'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client with the correctly prefixed environment variable
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// async function getVoiceMessage(inputText) {
//     try {
//         // Get the model for TTS
//         const model = genAI.getGenerativeModel({
//             model: "gemini-2.0-flash-exp",
//             generationConfig: {
//                 temperature: 0.9,
//             }
//         });

//         const result = await model.generateContent({
//             contents: [{
//                 parts: [{ text: inputText }]
//             }],
//             generationConfig: {
//                 responseModalities: ['AUDIO'],
//                 speechConfig: {
//                     voiceConfig: {
//                         prebuiltVoiceConfig: { voiceName: 'Kore' },
//                     },
//                 },
//             },
//         });

//         const response = await result.response;
//         const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

//         if (!audioData) {
//             console.error("No audio data received from Gemini API.");
//             return null;
//         }

//         // Convert base64 string to Uint8Array
//         const binaryString = atob(audioData);
//         const len = binaryString.length;
//         const bytes = new Uint8Array(len);
//         for (let i = 0; i < len; i++) {
//             bytes[i] = binaryString.charCodeAt(i);
//         }
//         return bytes;
//     } catch (error) {
//         console.error("Error generating voice message:", error);
//         return null;
//     }
// }

// async function playVoiceFromText(inputText) {
//     try {
//         const audioBytes = await getVoiceMessage(inputText);

//         if (!audioBytes) {
//             console.error("No audio bytes received");
//             return;
//         }

//         // Create audio blob with proper MIME type
//         const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
//         const audioUrl = URL.createObjectURL(audioBlob);
//         const audio = new Audio(audioUrl);

//         // Add error handling for audio playback
//         audio.onerror = (error) => {
//             console.error("Audio playback error:", error);
//             URL.revokeObjectURL(audioUrl);
//         };

//         audio.onended = () => {
//             URL.revokeObjectURL(audioUrl);
//         };

//         await audio.play();
//     } catch (error) {
//         console.error("Error playing voice:", error);
//     }
// }

/**
 * Sends an audio Blob to the Gemini API for speech-to-text conversion.
 * @param {Blob} audioBlob The audio Blob to send.
 * @returns {Promise<string|null>} A promise that resolves with the transcribed text, or null if there was an error.
 */
async function transcribeAudioWithGemini(audioBlob) {
    try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Get the model for transcription
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: audioBlob.type,
                    data: base64Audio,
                },
            },
            "Please transcribe this audio to text. Only return the transcribed text, nothing else."
        ]);

        const response = await result.response;
        const text = response.text();

        if (text && text.trim()) {
            return text.trim();
        } else {
            console.error("No text transcribed from audio.");
            return null;
        }
    } catch (error) {
        console.error("Error transcribing audio with Gemini:", error);
        return null;
    }
}

function containsWordCaseInsensitive(text, word) {
    if (!text || !word) {
        return false;
    }

    // Escape special characters in the word to use in a regex
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create a regular expression to find the word with word boundaries
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');

    return regex.test(text);
}

// Export the functions
export { transcribeAudioWithGemini, containsWordCaseInsensitive };
// getVoiceMessage, playVoiceFromText
