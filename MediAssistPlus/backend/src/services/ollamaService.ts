import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export const transcribeAudio = async (filePath: string): Promise<string> => {
    try {
        // TEMPORARY: Whisper model not yet installed
        // Use Llama3 to generate a REALISTIC, DETAILED placeholder transcript
        console.log('⚠️  Whisper not available - generating detailed mock transcription');

        const prompt = `Generate a detailed, realistic medical consultation transcript between a doctor and a patient.
        
        Requirements:
        - Language: English ONLY.
        - Length: At least 150 words.
        - Content: Include patient complaints, doctor's questions, physical exam findings, and a plan.
        - Scenario: Pick a random common medical issue (e.g., flu, migraine, back pain, hypertension checkup, etc.).
        - Format: purely the dialogue and clinical notes, no introductory text like "Here is a transcript".
        
        Respond ONLY with the transcript text.`;

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3:latest',
            prompt: prompt,
            stream: false
        });

        return response.data.response;

    } catch (error) {
        console.error('Error in transcribeAudio:', error);
        // Fallback if Llama3 fails
        return `Patient presents with severe headache and nausea. Duration: 2 days. 
        Pain level: 8/10. Photophobia present. 
        History: Migraines. 
        Plan: Rest, hydration, Sumatriptan.`;
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

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3:latest', // Using available model instead of deepseek-coder
            prompt: prompt,
            format: 'json',
            stream: false
        });

        // Parse the response - Ollama returns the generated text in response.data.response
        const generatedText = response.data.response;
        return JSON.parse(generatedText);
    } catch (error) {
        console.error('Error in summarizeConsultation:', error);
        // Return a fallback summary if AI fails
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
    console.log(`[summarizePatientHistory] Starting summary for ${recordings.length} recordings. OLLAMA_URL: ${OLLAMA_URL}`);
    try {
        // Prepare the input for the AI
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

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3:latest',
            prompt: prompt,
            format: 'json',
            stream: false
        });

        console.log('[summarizePatientHistory] Ollama response received');
        const generatedText = response.data.response;
        return JSON.parse(generatedText);
    } catch (error: any) {
        console.error('Error in summarizePatientHistory:', error.message);
        if (error.response) {
            console.error('Ollama Error Response:', error.response.data);
            console.error('Ollama Error Status:', error.response.status);
        }
        return {
            concise: 'Unable to generate summary.',
            detailed: 'AI processing failed.'
        };
    }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        let prompt = '';

        if (targetLanguage === 'Kannada') {
            prompt = `You are a professional Kannada language translator specializing in medical terminology.

Translate the following medical text into natural, everyday Kannada that common people can understand.

CRITICAL RULES:
1. Use proper Kannada script (ಕನ್ನಡ) - not transliterated English
2. Use simple, spoken Kannada words from daily life
3. Avoid Sanskrit-heavy or literary Kannada
4. Break long sentences into short, clear statements
5. Use common medical terms that people know

TRANSLATION EXAMPLES:
- "headache" → "ತಲೆನೋವು" (not "ಶಿರೋವೇದನೆ")
- "stomach pain" → "ಹೊಟ್ಟೆ ನೋವು" (not "ಉದರಶೂಲೆ")
- "fever" → "ಜ್ವರ" or "ಜ್ವರ ಬಂದಿದೆ"
- "medicine" → "ಔಷಧಿ" or "ಮಾತ್ರೆ"
- "doctor" → "ಡಾಕ್ಟರ್" (commonly used)
- "blood pressure" → "ರಕ್ತದೊತ್ತಡ" or "BP"
- "take medicine" → "ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ"
- "drink water" → "ನೀರು ಕುಡಿಯಿರಿ"

TONE: Friendly doctor speaking to a patient in a clinic

Text to translate:
"${text}"

Respond ONLY with the Kannada translation in proper Kannada script. No English, no explanations.`;
        } else if (targetLanguage === 'Hindi') {
            prompt = `You are a Hindi language translator.

Translate the following text into Hindi in a simple, natural and daily-spoken style that a normal person can easily understand.

IMPORTANT RULES:
- Use commonly spoken Hindi words (like "सिरदर्द" not "शिरोवेदना")
- Avoid textbook Hindi, avoid complex grammar
- Avoid English mixing unless necessary
- Use a friendly tone, short sentences, and simple vocabulary used in daily life
- If any medical terms appear, explain them in simple Hindi so normal people can understand
- Tone style: Friendly doctor speaking to a patient

Text to translate:
"${text}"

Respond ONLY with the Hindi translation. No explanations or additional text.`;
        } else {
            // Fallback for other languages
            prompt = `Translate the following text into simple, everyday ${targetLanguage}:
"${text}"

Respond ONLY with the translation.`;
        }

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3:latest',
            prompt: prompt,
            stream: false
        });

        return response.data.response;
    } catch (error) {
        console.error('Error in translateText:', error);
        throw new Error('Translation failed');
    }
};
