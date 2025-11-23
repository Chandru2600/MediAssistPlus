import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize the Google Cloud Translation API client
const translate = new Translate({
    key: process.env.GOOGLE_CLOUD_API_KEY
});

/**
 * Translate text to target language using Google Cloud Translation API
 * @param text - Text to translate
 * @param targetLanguage - Target language ('hi' for Hindi, 'kn' for Kannada, 'en' for English)
 * @returns Translated text
 */
export const translateWithGoogle = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        // Map language names to Google Translate language codes
        const languageCodeMap: { [key: string]: string } = {
            'Hindi': 'hi',
            'Kannada': 'kn',
            'English': 'en'
        };

        const targetCode = languageCodeMap[targetLanguage] || targetLanguage.toLowerCase();

        console.log(`[Google Translate] Translating to ${targetLanguage} (${targetCode})`);

        // Call Google Cloud Translation API
        const [translation] = await translate.translate(text, targetCode);

        console.log(`[Google Translate] Translation successful`);
        return translation;

    } catch (error: any) {
        console.error('[Google Translate] Error:', error.message);

        // If Google Translate fails, throw error to trigger fallback
        throw new Error(`Google Translation failed: ${error.message}`);
    }
};

/**
 * Check if Google Cloud Translation API is configured
 * @returns true if API key is set
 */
export const isGoogleTranslateConfigured = (): boolean => {
    return !!process.env.GOOGLE_CLOUD_API_KEY;
};
