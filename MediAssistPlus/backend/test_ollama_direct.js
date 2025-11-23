const axios = require('axios');

const OLLAMA_URL = 'http://100.81.92.33:11434';

async function testOllamaTranslation() {
    try {
        console.log('Testing Ollama translation...\n');

        const text = "Patient presents with severe headache and nausea.";
        const targetLanguage = "Hindi";

        const prompt = `Translate the following medical text into ${targetLanguage}.
        
        Text:
        "${text}"
        
        Respond ONLY with the translated text, no other commentary.`;

        console.log('Sending request to Ollama...');
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: 'llama3:latest',
            prompt: prompt,
            stream: false
        }, {
            timeout: 60000 // 60 second timeout
        });

        console.log('\n✅ Translation successful!');
        console.log('Result:', response.data.response);

    } catch (error) {
        console.error('\n❌ Translation failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

testOllamaTranslation();
