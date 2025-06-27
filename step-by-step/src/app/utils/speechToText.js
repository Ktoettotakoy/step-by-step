const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// Get your API key from environment variables or a secret management service
// It's not recommended to hardcode it in your code.
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function blobToGenerativePart(blob) {
    // Use FileReader to read the Blob as a Data URL
    const base64EncodedDataPromise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // The result includes the Data URL prefix "data:audio/webm;base64,"
        // We need to remove this prefix to get the pure Base64 string.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (err) => {
        reject(err);
      }
      reader.readAsDataURL(blob);
    });
  
    // Wait for the conversion to complete
    const base64Data = await base64EncodedDataPromise;
  
    // Return the object in the format Gemini API expects
    return {
      inlineData: {
        data: base64Data,
        mimeType: blob.type, // e.g., 'audio/webm' or 'audio/mp3'
      },
    };
  }

// --- Helper Function to convert a file to a GenerativePart ---
// This is the format the Gemini API expects for file inputs.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

/**
 * Transcribes an audio file using the Gemini 1.5 Pro model.
 *
 * @param {string} filePath The path to the local MP3 audio file.
 * @returns {Promise<string>} The transcribed text.
 */
async function transcribeAudio(filePath) {
  // --- 1. Initialize the Model ---
  // Make sure to use a model that supports audio input, like gemini-1.5-pro
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  console.log(`Transcribing "${filePath}"...`);

  try {
    // --- 2. Create the Prompt ---
    // The prompt can be simple; the model understands the context of the audio file.
    const prompt = "Please provide a verbatim transcription of this audio file. The audio contains a person speaking.";

    // --- 3. Prepare the Audio File Part ---
    const audioFile = fileToGenerativePart(filePath, "audio/mp3");

    // --- 4. Make the API Call ---
    // Pass the prompt and the audio file to the model
    const result = await model.generateContent([prompt, audioFile]);
    const response = await result.response;
    const text = response.text();

    console.log("Transcription complete.");
    return text;

  } catch (error) {
    console.error("Error during transcription:", error);
    throw new Error("Failed to transcribe audio. See the console for details.");
  }
}


async function transcribeAudioFromBlob(blob) {
    // --- 1. Initialize the Model ---
    // Make sure to use a model that supports audio input, like gemini-1.5-pro
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
    console.log(`Transcribing "${filePath}"...`);

    try {
      // --- 2. Create the Prompt ---
      // The prompt can be simple; the model understands the context of the audio file.
      const prompt = "Please provide a verbatim transcription of this audio file. The audio contains a person speaking.";
        
      const audioPart = await blobToGenerativePart(audioBlob);

      const result = await model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();


      console.log("Transcription complete.");
      return text;
  
    } catch (error) {
      console.error("Error during transcription:", error);
      throw new Error("Failed to transcribe audio. See the console for details.");
    }
  }

// --- Example Usage ---
async function main() {
  const audioFilePath = "./my-speech.mp3"; // <-- IMPORTANT: Change this to your file's path

  // Check if the file exists
  if (!fs.existsSync(audioFilePath)) {
    console.error(`Error: Audio file not found at "${audioFilePath}"`);
    console.log("Please place an MP3 file named 'my-speech.mp3' in the same directory, or update the 'audioFilePath' variable.");
    return;
  }

  try {
    const transcription = await transcribeAudio(audioFilePath);
    console.log("\n--- Transcription Result ---");
    console.log(transcription);
    console.log("--------------------------\n");
  } catch (error) {
    // The error is already logged in the transcribeAudio function
    // but we catch it here to prevent the process from crashing.
  }
}

export default {transcribeAudioFromBlob}

// main();