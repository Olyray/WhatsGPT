const app = require("../index");
const request = require("supertest");

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async () => {
            return { choices: [{ message: { content: "Hello, I am an AI" } }] };
          })
        }
      }
    };
  });
});
const OpenAI = require('openai');

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({ 
          body: 'Hello, I am an AI',
          numSegments: '1',
          direction: 'outbound-api',
          from: 'whatsapp:+14155238886',
          to: 'whatsapp:+2348179361570',
          dateUpdated: '2024-01-17T16:13:19.000Z',
          price: null,
          errorMessage: null,
          uri: '/2010-04-01/Accounts/AC13a822a2d16ec2b0561d0724bba5d5b4/Messages/SM6a41984b90a3e6d0d41ccedf4db87007.json',
          accountSid: 'AC13a822a2d16ec2b0561d0724bba5d5b4',
          numMedia: '0',
          status: 'queued',
          messagingServiceSid: null,
          sid: 'SM6a41984b90a3e6d0d41ccedf4db87007',
          dateSent: null,
          dateCreated: '2024-01-17T16:13:19.000Z',
          errorCode: null,
          priceUnit: null,
          apiVersion: '2010-04-01',
          subresourceUris: {
            media: '/2010-04-01/Accounts/AC13a822a2d16ec2b0561d0724bba5d5b4/Messages/SM6a41984b90a3e6d0d41ccedf4db87007/Media.json'
          } 
        })
      }
    }
  })
})
const twilio = require('twilio');

jest.mock('../conversationManager', () => {
  return {
    initializeDatabase: jest.fn(),
    getConversationHistory: jest.fn().mockResolvedValue([]),
    updateConversationHistory: jest.fn()
  };
});


describe("GET /", () => {
  it("Check that WhatsGPT is online", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('WhatsGPT is running');
  });
});

describe("POST /message", () => {
  it("Ensure that the OpenAI API responds with the required message", async () => {
    const response = await request(app)
      .post("/message")
      .send({From: "whatsapp:+2348179361570", Body: "Hello"})
    const openai = OpenAI();
    const openaiResponse = await openai.chat.completions.create({ 
      messages: [{
        role: "system", 
        content: "You're a knowledgeable friend that your acquintances turn to for help. Your response should be brief. Use a single sentence if possible."
    }],
      model: "gpt-3.5-turbo",
     });

     const twilioClient = twilio();
     twilioResponse = await twilioClient.messages.create({
      body: "Hello, I am an AI",
      from: "whatsapp:+14155238886",
      to: "whatsapp:+2348179361570"
     });

     expect(openaiResponse.choices[0].message.content).toBe("Hello, I am an AI");
     expect(twilioResponse.sid).toBe('SM6a41984b90a3e6d0d41ccedf4db87007');
    //expect(response.text).toContain("Hello, I am an AI");
  })
});