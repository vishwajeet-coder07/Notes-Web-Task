export const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

class GeminiService {
  static async callGeminiAPI(prompt) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  static async summarizeText(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for summarization');
    }

    const prompt = `Please provide a concise summary of the following text. Focus on the main points and key information:\n\n${text}`;
    return this.callGeminiAPI(prompt);
  }

  static async explainText(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for explanation');
    }

    const prompt = `Please provide a detailed explanation of the following text. Break down complex concepts, provide context, and make it easier to understand:\n\n${text}`;
    return this.callGeminiAPI(prompt);
  }

  static async generateTitle(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for title generation');
    }

    const prompt = `Based on the following text content, generate a concise, descriptive title that captures the main topic or theme. The title should be between 3-8 words and engaging. Only return the title text without any additional formatting or quotes:\n\n${text}`;
    return this.callGeminiAPI(prompt);
  }

  static async getWritingSuggestions(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for writing suggestions');
    }

    const prompt = `Please analyze the following text and provide helpful writing suggestions to improve it. Include suggestions for:
    1. Clarity and readability improvements
    2. Grammar and style enhancements
    3. Structure and organization suggestions
    4. Content expansion ideas
    5. Tone and flow improvements
    
    Format your response as a clear, actionable list of suggestions:
    
    ${text}`;
    return this.callGeminiAPI(prompt);
  }
}

export default GeminiService;