# WhatsGPT

WhatsGPT allows you to create an AI chatbot on whatsapp. It makes use of Twilio and OpenAI's API.

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/Olyray/WhatsGPT

2. **Navigate to the project directory**:
    ```bash
    cd WhatsGPT

3. **Install the required packages**:
    ```bash
    npm install

## Usage

1. **Set up the environment variables**:
The API makes use of OpenAI's API and Twilio. 

Then use the provided .env.example as template. Rename it to .env and use it to fill in your API credentials. Learn how to use OpenAI's APi [here](https://platform.openai.com/docs/quickstart?context=node)

For Twilio, you can follow its [node.js quickstart](https://www.twilio.com/docs/whatsapp/quickstart/node#sign-up-for-twilio-and-install-the-whatsapp-channel) to get familiar with its API. 

The script also uses postgreSQL as its database. 

2. **Run the node app**:
    ```bash
    node index.js

This would start the node server. If you're running the server locally, you'll need to use ngrok with to publicly expose your server for use within twilio.

After this, you should be able to chat with your bot.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)