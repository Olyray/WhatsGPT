require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require("openai");
const twilio = require('twilio');
const {
    initializeDatabase,
    getConversationHistory,
    updateConversationHistory
} = require('./conversationManager');
const { ModelBuildListInstance } = require('twilio/lib/rest/autopilot/v1/assistant/modelBuild');

// Initialize Express and middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// Setup Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Setup OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// initialise the database
initializeDatabase();

app.get('/', (req, res) => {
    res.send('WhatsGPT is running');
});

// Endpoint that Twilio will post to
app.post('/message', async (req, res) => {
    const userId = req.body.From;
    const incomingMsg = req.body.Body;

    try {
        // Retrieve conversation history for the user
        let conversationHistory = await getConversationHistory(userId);

        // Add the incoming message to the conversation history
        conversationHistory.push({ role: "user", content: incomingMsg });

        // Send the message to OpenAI API
        const openaiResponse = await openai.chat.completions.create({
          messages: [{
            role: "system", 
            content: "You're a knowledgeable friend that your acquintances turn to for help. Your response should be brief. Use a single sentence if possible."
        }, 
        ...conversationHistory],
          model: "gpt-3.5-turbo",
      });

      console.log(conversationHistory);

        // Extract the text from the OpenAI response
        const message = openaiResponse.choices[0].message.content;

        // Update conversation history with OpenAI's response
        conversationHistory.push({ role: "assistant", content: message });
        updateConversationHistory(userId, conversationHistory);

        // Send the message back to the user on WhatsApp
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: req.body.From
        });

        // Send a 200 response to Twilio
        res.status(200).end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = app;

// Start the server
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}
