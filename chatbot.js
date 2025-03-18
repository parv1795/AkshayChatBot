const OpenAI = require('openai');
const { akshayPersonaPrompt } = require('./persona');

// Conversation history to maintain context
const conversationHistory = [];

/**
 * Generate a response using OpenAI API with Akshay Kumar's persona
 * @param {string} userMessage - User's input message
 * @returns {Promise<string>} Bot's response
 */
async function generateResponse(userMessage) {
  try {
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;

    // Validate API key
    if (!apiKey) {
      throw new Error('API Key is missing. Please validate your key first.');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Maintain conversation context (limit to last 5 exchanges)
    conversationHistory.push({ role: 'user', content: userMessage });
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, 5);
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: 'system', 
          content: akshayPersonaPrompt 
        },
        ...conversationHistory
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    // Extract and save bot response
    const botResponse = completion.choices[0].message.content.trim();
    conversationHistory.push({ role: 'assistant', content: botResponse });

    return botResponse;
  } catch (error) {
    console.error('❌ Detailed Error:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error Response:', error.response.data);
      console.error('Error Status:', error.response.status);
    }

    // Provide a more informative fallback response
    return `Arre boss, technology thoda mood off kar raha hai! 🤖 Error details: ${error.message}`;
  }
}

module.exports = { generateResponse };