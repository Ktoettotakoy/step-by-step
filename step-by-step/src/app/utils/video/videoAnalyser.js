// assume video was sampled, assume we retrieved from youtube by some link

// const { exec } = require('child_process');
// const fs = require('fs').promises;
// const path = require('path');

// // --- CONFIGURATION ---
// const videoUrl = 'https://www.youtube.com/watch?v=1pLqjZuTNjw'; // <-- PASTE YOUR VIDEO URL HERE
// const frameCount = 10; // The number of screenshots to create

// const outputDir = path.join(__dirname, 'output');
// const videoDir = path.join(outputDir, 'video');
// const framesDir = path.join(outputDir, 'frames');
// // --- END CONFIGURATION ---

/**
 * A helper function to run shell commands and return them as a Promise.
 * @param {string} command The command to execute.
 * @returns {Promise<string>} The stdout of the command.
 */
// function runCommand(command) {
//   return new Promise((resolve, reject) => {
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error executing command: ${command}`);
//         console.error(`stderr: ${stderr}`);
//         return reject(error);
//       }
//       resolve(stdout.trim());
//     });
//   });
// }

/**
 * The main function to orchestrate the video processing.
 */
// async function main() {
//   try {
//     // 1. Setup: Create output directories
//     console.log('Setting up directories...');
//     await fs.mkdir(videoDir, { recursive: true });
//     await fs.mkdir(framesDir, { recursive: true });
//     console.log(`Directories created at: ${outputDir}`);

//     // 2. Download the video using yt-dlp
//     console.log(`\nDownloading video from: ${videoUrl}`);
//     const videoPath = path.join(videoDir, 'downloaded_video.mp4');
//     // Using -f 'best[ext=mp4]' to prefer a standard mp4 file
//     const downloadCommand = `yt-dlp -f "best[ext=mp4]/best" -o "${videoPath}" "${videoUrl}"`;
//     await runCommand(downloadCommand);
//     console.log(`Video downloaded successfully to: ${videoPath}`);

//     // 3. Get video duration using ffprobe (part of FFmpeg)
//     console.log('\nGetting video duration...');
//     const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
//     const durationStr = await runCommand(durationCommand);
//     const duration = parseFloat(durationStr);
//     console.log(`Video duration: ${duration.toFixed(2)} seconds`);

//     if (isNaN(duration) || duration <= 0) {
//         throw new Error('Could not determine video duration.');
//     }

//     // 4. Extract frames using FFmpeg
//     console.log(`\nExtracting ${frameCount} frames...`);
//     // We calculate the frame rate needed to get N frames over the total duration.
//     // For example, for a 60-second video and 10 frames, we need 10/60 = 0.166 FPS (or 1 frame every 6 seconds).
//     const fps = frameCount / duration;
//     const framesOutputPath = path.join(framesDir, 'frame_%03d.png');
//     const extractCommand = `ffmpeg -i "${videoPath}" -vf "fps=${fps}" -y "${framesOutputPath}"`;

//     await runCommand(extractCommand);
//     console.log(`\n✅ Success! ${frameCount} frames extracted to: ${framesDir}`);

//   } catch (error) {
//     console.error('\n❌ An error occurred during the process:');
//     console.error(error.message);
//     process.exit(1); // Exit with an error code
//   }
// }

// // Run the main function
// main();


// src/utils/imageAnalyzer.js
import { GoogleGenAI } from "@google/genai";
import fs from 'fs/promises'; // Use fs/promises for async file operations
import path from 'path';

// Initialize the AI model (replace with your actual API key and setup)
// Ensure you have process.env.GEMINI_API_KEY set in your environment
const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

// Helper function to convert image file to base64
async function fileToGenerativePart(filePath, mimeType) { // Make the function async
  const fileData = await fs.readFile(filePath); // Use await with fs.readFile
  return {
    inlineData: {
      data: fileData.toString("base64"),
      mimeType
    },
  };
}

async function analyzeSampleImages() {
  const samplesDir = path.join(process.cwd(), 'src', 'app', 'utils', 'video', 'samples'); // Adjust path if 'samples' is not in root
  let imageFiles = [];
  try {
    imageFiles = await fs.readdir(samplesDir);
  } catch (error) {
    console.error(`Error reading samples directory ${samplesDir}:`, error);
    return [];
  }

  const recognizedWords = [];

  for (const file of imageFiles) {
    console.log(`Processing file: ${file}`);
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const filePath = path.join(samplesDir, file);
      try {
        const imagePart = await fileToGenerativePart(filePath, `image/${file.split('.').pop()}`);
        const prompt = `What is the main subject in this image? Respond with only one word.
        If you don't know, say one of the following only once per picture:
        sea, elephant, tiger, chameleon, parrot. Chance should be 20% for each word.`;

        const result = await ai.models.generateContent(
            {model: "gemini-2.5-flash",
                contents: `${prompt} ${imagePart}`,
    });


        const text = result.text.trim(); // Get the response text and trim whitespace

        // Basic validation for a single word
        if (text.includes(' ') || text.length === 0) {
          console.warn(`AI responded with more than one word or no word for ${file}: "${text}". Skipping.`);
        } else {
          recognizedWords.push(text.toLowerCase()); // Add the word to the list, convert to lowercase
        }

      } catch (error) {
        console.error(`Error processing image ${file}:`, error);
      }
    }
  }
  return recognizedWords;
}

export { analyzeSampleImages };
