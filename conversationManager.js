require('dotenv').config();
const { Pool } = require('pg');
const { OpenAI } = require('openai');
const { encoding_for_model } = require('@dqbd/tiktoken');

// Connect to the database
const pool = new Pool({
    // PostgreSQL connection settings
    /*user: 'postgres',
    host: 'localhost',
    database: 'olyray',
    password: process.env.DATABASE_PASSWORD,
    port: 5432,*/
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Initialise the database
async function initializeDatabase() {
    const createTableText = `
        CREATE TABLE IF NOT EXISTS user_conversations (
            whatsapp_number VARCHAR(30) PRIMARY KEY,
            conversation_history TEXT
        );
    `;

    try {
        await pool.query(createTableText);
        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database: ", error);
    }
}

// Get the conversation history
async function getConversationHistory(whatsappNumber) {
    const res = await pool.query('SELECT conversation_history FROM user_conversations WHERE whatsapp_number = $1', [whatsappNumber]);

    if (res.rows.length === 0) {
        return [];
    }

    return JSON.parse(res.rows[0].conversation_history);
}

// Update the conversation history 
async function updateConversationHistory(whatsappNumber, conversationHistory) {
    // Summarise the conversation if it's more than 2000 tokens
    const tokenCount = await countTokens(JSON.stringify(conversationHistory));
    if (tokenCount >= 2000) {
        conversationHistory = await summarizeConversation(conversationHistory);
    }

    // Update the conversation history
    try{
      const conversationHistoryString = JSON.stringify(conversationHistory);
      await pool.query('INSERT INTO user_conversations (whatsapp_number, conversation_history) VALUES ($1, $2) ON CONFLICT (whatsapp_number) DO UPDATE SET conversation_history = EXCLUDED.conversation_history', [whatsappNumber, conversationHistoryString]);
    } catch (err) {
      console.error(err);
    }
  }

  // Summarise the conversation
async function summarizeConversation(conversationHistory) {
    const conversationText = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Summarize the following conversation in not more than 100 words:\n\n" + conversationText }],
    });

    const context = summaryResponse.choices[0].message.content;
    return [{ role: 'system', content: context }]
}

// Count the tokens
async function countTokens(text) {
    try {
        const encoder = encoding_for_model('gpt-3.5-turbo');
        const tokens = encoder.encode(text);
        encoder.free();
        return tokens.length;
    } catch (error) {
        console.error("Error in tokenizing text: ", error);
        return 0;
    }
}

module.exports = { initializeDatabase, getConversationHistory, updateConversationHistory, summarizeConversation, countTokens };
