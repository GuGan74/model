/**
 * Translates text using the free Google Translate API endpoint.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The target language code (e.g., 'ta', 'hi', 'te').
 * @returns {Promise<string>} - The translated text.
 */
export async function translateText(text, targetLang) {
    if (!text || targetLang === 'en' || !targetLang) return text;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        // The response format is [[["translatedText", "originalText", ...]]]
        if (data && data[0]) {
            return data[0].map(item => item[0]).join('');
        }
        return text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}
