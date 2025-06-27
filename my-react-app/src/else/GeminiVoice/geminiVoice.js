import {GoogleGenAI} from '@google/genai';


const geminiAI = new GoogleGenAI({ apiKey: import.meta.env.api });

async function saveWaveFile(
   filename,
   pcmData,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
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

async function getVoiceMessage(inputText) {

   const response = await ai.models.generateContent({
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
   const audioBuffer = Buffer.from(data, 'base64');

 return audioBuffer;
}

async function playVoiceFromText(inputText) {
 const audioBytes = await getVoiceMessage(inputText);

 // Assuming audioBytes is a Uint8Array or similar
 const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
 const audioUrl = URL.createObjectURL(audioBlob);
 const audio = new Audio(audioUrl);
 audio.play();
}

export { getVoiceMessage, playVoiceFromText };
