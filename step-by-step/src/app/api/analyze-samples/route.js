// src/app/api/analyze-samples/route.js
import { analyzeSampleImages } from '../../utils/video/videoAnalyser';

export async function GET() {
  try {
    const wordList = await analyzeSampleImages();
    return new Response(JSON.stringify(wordList), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Failed to analyze sample images:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze sample images." }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
