import axios from 'axios';
import fs from 'fs';

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

export const transcribeWithGoogle = async (filePath: string, languageCode: string = 'en-US'): Promise<string> => {
    if (!API_KEY) {
        throw new Error('Google Cloud API Key not configured');
    }

    console.log(`[Google STT] Transcribing file: ${filePath} in language: ${languageCode}`);

    try {
        const audioContent = fs.readFileSync(filePath).toString('base64');

        // Detect encoding based on extension
        let encoding = 'ENCODING_UNSPECIFIED';
        if (filePath.endsWith('.mp3')) {
            encoding = 'MP3';
        }

        // Note: Google STT REST API support for other formats like M4A/AAC is limited without conversion.
        // We rely on the fallback if this fails.

        const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`,
            {
                config: {
                    encoding: encoding,
                    languageCode: languageCode,
                    enableAutomaticPunctuation: true,
                    model: 'default'
                },
                audio: {
                    content: audioContent
                }
            }
        );

        if (response.data.results) {
            const transcript = response.data.results
                .map((r: any) => r.alternatives[0].transcript)
                .join('\n');
            console.log('[Google STT] Success');
            return transcript;
        } else if (response.data.error) {
            throw new Error(response.data.error.message);
        } else {
            console.log('[Google STT] No transcription results returned');
            return '';
        }

    } catch (error: any) {
        console.error('[Google STT] Error:', error.response?.data || error.message);
        throw error;
    }
};
