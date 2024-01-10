require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require("openai");
const twilio = require('twilio');

// Initialize Express and middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Setup Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Setup OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.get('/', (req, res) => {
    res.send('WhatsGPT is running');
});

// Endpoint that Twilio will post to
app.post('/message', async (req, res) => {
    const incomingMsg = req.body.Body;

    try {
        // Send the message to OpenAI API
        const openaiResponse = await openai.chat.completions.create({
          messages: [{ role: "system", content: incomingMsg }],
          model: "gpt-3.5-turbo",
      });

        // Extract the text from the OpenAI response
        const message = openaiResponse.choices[0].message.content;

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

// Start the server
app.listen(3000, () => console.log('Server is running on port 3000'));
