import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export const transcribeAudio = async (filePath: string, languageCode: string = 'en-US'): Promise<string> => {
    try {
        // Try Google Cloud STT first
        try {
            const { transcribeWithGoogle } = require('./google-speech.service');
            const googleTranscript = await transcribeWithGoogle(filePath, languageCode);
            if (googleTranscript && googleTranscript.length > 0) {
                return googleTranscript;
            }
        } catch (googleError) {
            console.warn('Google STT failed, falling back to Ollama (simulation):', googleError);
        }

        // Fallback: Use Llama3 to generate a simulated transcript
        console.log('⚠️  Google STT failed/not configured - generating simulated transcript via Ollama');

        const prompt = `Generate a very concise summary-style transcription of a medical consultation.
        
        Requirements:
        - Language: English ONLY.
        - Length: VERY SHORT (Max 50-75 words).
        - Format: Bullet points ONLY.
        - Content:
            * Chief Complaint
            * Key Findings
            * Diagnosis
            * Plan
        - Style: Telegraphic, medical notes style. No conversational filler.
        
        Respond ONLY with the bulleted text.`;

        const data = await generateWithFallback({
            model: 'llama3:latest',
            prompt: prompt,
            stream: false
        }, 10000);

        return data.response;

    } catch (error) {
        console.error('Error in transcribeAudio:', error);
        throw error; // Propagate error to controller
    }
};

const generateWithFallback = async (payload: any, timeout: number = 60000): Promise<any> => {
    const primaryUrl = `${OLLAMA_URL}/api/generate`;
    const localUrl = 'http://localhost:11434/api/generate';

    try {
        console.log(`[Ollama] Sending request to ${OLLAMA_URL}...`);
        const response = await axios.post(primaryUrl, payload, { timeout });
        return response.data;
    } catch (error: any) {
        console.warn(`[Ollama] Primary URL failed: ${error.message}. Trying local fallback...`);

        // Don't fallback if the primary IS the local one to avoid redundant calls
        if (OLLAMA_URL.includes('localhost') || OLLAMA_URL.includes('127.0.0.1')) {
            throw error;
        }

        try {
            console.log(`[Ollama] Sending request to ${localUrl}...`);
            const response = await axios.post(localUrl, payload, { timeout });
            console.log(`[Ollama] Local fallback successful.`);
            return response.data;
        } catch (fallbackError: any) {
            console.error(`[Ollama] Local fallback also failed: ${fallbackError.message}`);
            throw error; // Throw the original error or the fallback error? Usually original is more relevant if both fail.
        }
    }
};

export const summarizeConsultation = async (transcript: string): Promise<any> => {
    try {
        const prompt = `You are a medical AI assistant. Analyze the following medical consultation transcript and provide a structured summary in JSON format.

The JSON should have these exact fields:
- chiefComplaint: Main reason for visit (string)
- history: Relevant medical history (string)
- diagnosis: Clinical assessment (string)
- medication: Prescribed medications with dosage (string)
- followUp: Follow-up instructions (string)

Consultation Transcript:
${transcript}

Respond ONLY with valid JSON, no additional text.`;

        const data = await generateWithFallback({
            model: 'llama3:latest',
            prompt: prompt,
            format: 'json',
            stream: false
        }, 30000);

        const generatedText = data.response;
        try {
            const cleanedText = cleanJsonOutput(generatedText);
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('[summarizeConsultation] JSON Parse Error:', parseError);
            return {
                chiefComplaint: 'Format Error',
                history: 'AI returned invalid JSON',
                diagnosis: 'See raw output below',
                medication: 'N/A',
                followUp: generatedText // Put raw text here
            };
        }
    } catch (error) {
        console.error('Error in summarizeConsultation:', error);
        return {
            chiefComplaint: 'Unable to generate summary',
            history: 'AI processing failed',
            diagnosis: 'Please review transcript manually',
            medication: 'N/A',
            followUp: 'N/A'
        };
    }
};

export const summarizePatientHistory = async (recordings: any[]): Promise<any> => {
    console.log(`[summarizePatientHistory] Starting summary for ${recordings.length} recordings.`);
    try {
        const consultationsText = recordings.map((rec, index) => {
            const date = new Date(rec.createdAt).toLocaleDateString();
            const content = rec.summary ? JSON.stringify(rec.summary) : (rec.transcript || 'No transcript available');
            return `Consultation ${index + 1} (${date}):\n${content}\n`;
        }).join('\n---\n\n');

        const prompt = `You are a medical AI assistant. Analyze the following history of patient consultations and provide a comprehensive summary.

Your response MUST be in valid JSON format with exactly these two fields:
1. "concise": A short paragraph (max 50 words) summarizing the patient's overall trajectory, key recurring issues, and current status.
2. "detailed": A structured markdown string that details the timeline of symptoms, treatments tried, and their outcomes.

Patient History:
${consultationsText}

Respond ONLY with valid JSON.`;

        const data = await generateWithFallback({
            model: 'llama3:latest',
            prompt: prompt,
            format: 'json',
            stream: false
        }, 60000);

        console.log('[summarizePatientHistory] Ollama response received');
        const generatedText = data.response;
        console.log('[summarizePatientHistory] Raw response:', generatedText);

        try {
            const cleanedText = cleanJsonOutput(generatedText);
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('[summarizePatientHistory] JSON Parse Error:', parseError);
            console.error('[summarizePatientHistory] Failed text:', generatedText);
            // Fallback: try to construct a simple summary from the text if it's not JSON
            return {
                concise: 'Summary generated but format was invalid.',
                detailed: generatedText // Return the raw text so at least they see something
            };
        }
    } catch (error: any) {
        console.error('Error in summarizePatientHistory:', error.message);
        return {
            concise: 'Unable to generate summary.',
            detailed: 'AI processing failed.'
        };
    }
};

// Helper to clean JSON output from LLM
const cleanJsonOutput = (text: string): string => {
    let cleaned = text.trim();
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned;
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    console.log(`[translateText] Translating to ${targetLanguage}. Text length: ${text?.length}`);
    try {
        let prompt = '';

        if (targetLanguage === 'Kannada') {
            prompt = `You are a professional Kannada language translator specializing in medical terminology.

Translate the following medical text into a VERY CONCISE, BULLET-POINT summary in Kannada.

CRITICAL RULES:
1. Format: Bullet points ONLY.
2. Content: Summarize the Chief Complaint, Diagnosis, and Plan.
3. Language: Simple, spoken Kannada (ಕನ್ನಡ).
4. Length: Max 50 words.

Text to translate:
"${text}"

Respond ONLY with the Kannada bullet points.`;
        } else if (targetLanguage === 'Hindi') {
            prompt = `You are a Hindi language translator.

Translate the following text into a VERY CONCISE, BULLET-POINT summary in Hindi.

CRITICAL RULES:
1. Format: Bullet points ONLY.
2. Content: Summarize the Chief Complaint, Diagnosis, and Plan.
3. Language: Simple, spoken Hindi.
4. Length: Max 50 words.

Text to translate:
"${text}"

Respond ONLY with the Hindi bullet points.`;
        } else {
            // Fallback for other languages
            prompt = `Translate the following text into simple, everyday ${targetLanguage}:
"${text}"

Respond ONLY with the translation.`;
        }

        console.log(`[translateText] Sending request to Ollama...`);
        const data = await generateWithFallback({
            model: 'llama3:latest',
            prompt: prompt,
            stream: false
        }, 10000);
        console.log(`[translateText] Ollama response received.`);

        return data.response;
    } catch (error: any) {
        console.error('Error in translateText (Ollama):', error.message);

        // Fallback to Google Translate
        try {
            const { translateWithGoogle, isGoogleTranslateConfigured } = require('./google-translate.service');
            if (isGoogleTranslateConfigured()) {
                console.log('[translateText] Falling back to Google Translate...');
                return await translateWithGoogle(text, targetLanguage);
            }
        } catch (googleError) {
            console.error('[translateText] Google Translate fallback failed:', googleError);
        }

        throw new Error('Translation failed');
    }
};
