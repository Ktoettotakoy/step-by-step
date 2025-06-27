'use client';

import { GoogleGenAI } from '@google/genai';

// Initialize the API client with the correctly prefixed environment variable
const geminiAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
// console.log("Gemini AI initialized with API key:", process.env.NEXT_PUBLIC_GEMINI_API_KEY);
// The saveWaveFile function is problematic for a browser environment.
// If your goal is to *save* the audio file from the browser,
// you would typically create a download link.
// The `wav` module and `Buffer` are Node.js specific.
// I'm commenting it out as it won't work client-side.
/*
async function saveWaveFile(
    filename,
    pcmData,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    // This function requires the 'wav' Node.js module and 'Buffer',
    // which are not available in a browser environment.
    // If you need to save a WAV file on the client, you'd use different
    // browser-specific techniques (e.g., creating a Blob and a download link).
    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filename, { // `wav` is not defined/imported for browser
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}
*/

async function getVoiceMessage(inputText) {
    const response = await geminiAI.models.generateContent({ // <-- Changed 'ai' to 'geminiAI'
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: inputText }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!data) {
        console.error("No audio data received from Gemini API.");
        return null; // Or throw an error
    }

    // Convert base64 string to Uint8Array (browser-compatible alternative to Buffer)
    // A more robust way might be to decode the base64 string directly into an ArrayBuffer or Blob
    const binaryString = atob(data); // Decodes base64 to binary string
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes; // This is a Uint8Array
}

async function playVoiceFromText(inputText) {
    const audioBytes = await getVoiceMessage(inputText);

    if (!audioBytes) {
        return; // Exit if no audio data
    }

    // audioBytes is now a Uint8Array
    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    // Optional: Clean up the object URL after the audio has loaded/played
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        console.error("Error playing audio.");
    };

}

/**
 * Sends an audio Blob to the Gemini API for speech-to-text conversion.
 * @param {Blob} audioBlob The audio Blob to send.
 * @returns {Promise<string|null>} A promise that resolves with the transcribed text, or null if there was an error.
 */
async function transcribeAudioWithGemini(audioBlob) {
    try {
      // Read the audio Blob as a Base64 string
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
  
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1]; // Get the Base64 string
  
          // Call the Gemini API for speech-to-text
          // Replace 'your-speech-to-text-model' with the actual Gemini model name
          // for speech recognition. Refer to the Gemini API documentation.
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use an appropriate model name
  
          const result = await model.generateContent({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: audioBlob.type, // Use the MIME type from the Blob
                      data: base64Audio,
                    },
                  },
                ],
              },
              {
                parts: [{ text: "Transcribe the following audio." }], // Instruct Gemini to transcribe
              },
            ],
          });
  
          const response = await result.response;
          const text = response.text(); // Get the transcribed text
  
          if (text) {
            resolve(text);
          } else {
            console.error("No text transcribed from audio.");
            resolve(null);
          }
        };
  
        reader.onerror = (error) => {
          console.error("Error reading audio blob:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error("Error transcribing audio with Gemini:", error);
      return null;
    }
}



  function containsWordCaseInsensitive(text, word) {
    if (!text || !word) {
      return false; // Handle empty or null inputs
    }
  
    // Escape special characters in the word to use in a regex
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
    // Create a regular expression to find the word with word boundaries
    // 'i' flag for case-insensitive matching
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
  
    // Test the text against the regex
    return regex.test(text);
  }
  


// Export only the functions that are intended for client-side use.
export { getVoiceMessage, playVoiceFromText, transcribeAudioWithGemini, containsWordCaseInsensitive };
